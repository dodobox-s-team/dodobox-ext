#!/usr/bin/python3
import argparse
import os
import sys
import time
from subprocess import DEVNULL, Popen

parser = argparse.ArgumentParser('dodobox')
subparsers = parser.add_subparsers(help='Action to perform', dest='action', required=True)
actions = {}


def action(name, help=None, **kwargs):
    p = subparsers.add_parser(name, help=help, **kwargs)

    def decorator(cls):
        actions[name] = action = cls
        action.configure(p)
        return cls

    return decorator


class Command:
    def __init__(self, config, testing=False, project=None):
        if isinstance(config, Command):
            testing = config.testing
            project = config.project
            config = config.config

        self.config = config
        self.testing = testing
        self.project = project or self.config.project

    @classmethod
    def configure(cls, parser):
        pass

    def run(self):
        raise NotImplementedError


class ProcessCommand(Command):
    def run(self, *args, exit=False, **kwargs):
        code = Popen([str(arg) for arg in args], **kwargs).wait()

        for std in ['stdin', 'stdout', 'stderr']:
            fd = kwargs.get(std, None)
            if isinstance(fd, int) and fd != DEVNULL:
                os.close(fd)

        if exit and code != 0:
            sys.exit(code)

        return code


class DockerCompose(ProcessCommand):
    def run(self, *args, **kwargs):
        dc = ['docker-compose', '-p', self.project]

        if self.config.test or self.testing:
            dc.extend(('-f', 'docker-compose.test.yaml'))

        return super(DockerCompose, self).run(*dc, *args, **kwargs)


class TestCommand(DockerCompose):
    def __init__(self, config):
        super().__init__(config, testing=True)

        if not config.project.startswith('test'):
            self.project = f'test{config.project}'

    @classmethod
    def configure(cls, parser):
        parser.add_argument('-e', '--exit', action='store_true', help='Exit if the tests fails.', dest='exit')
        return super().configure(parser)


@action('build', help='Build the dev environment with docker compose.')
class ComposeBuild(DockerCompose):
    @classmethod
    def configure(cls, parser):
        parser.add_argument('-p', '--pull', action='store_true', help='Pull the images from docker hub.', dest='pull')

    def run(self):
        args = ['build']
        if self.config.pull:
            args.append('--pull')

        return super(ComposeBuild, self).run(*args)


@action('up', help='Starts the dev environment with docker compose.')
class ComposeUp(DockerCompose):
    @classmethod
    def configure(cls, parser):
        parser.add_argument('-f', action='store_true', help='Run in foreground.', dest='foreground')

    def run(self):
        args = []
        if not self.config.foreground:
            args = ['-d']

        return super().run('up', *args)


@action('down', help='Stops the dev environment.')
class ComposeDown(DockerCompose):
    @classmethod
    def configure(cls, parser):
        parser.add_argument('-t', type=int, help='Specify a shutdown timeout in seconds.', dest='timeout')

    def run(self):
        args = []
        if self.config.timeout:
            args = ['-t', self.config.timeout]

        return super().run('down', *args)


@action('rebuild', help='Rebuild the images and restart the environment.')
class ComposeRebuild(ComposeDown, ComposeBuild, ComposeUp, DockerCompose):
    @classmethod
    def configure(cls, parser):
        ComposeDown.configure(parser)
        ComposeBuild.configure(parser)
        ComposeUp.configure(parser)

    def run(self):
        ComposeDown(self).run()
        ComposeBuild(self).run()
        ComposeUp(self).run()


@action('restart', help='Restart the dev environment.')
class ComposeRestart(DockerCompose):
    @classmethod
    def configure(cls, parser):
        parser.add_argument('-t', type=int, help='Specify a shutdown timeout in seconds.', dest='timeout')

    def run(self):
        args = []
        if self.config.timeout:
            args = ['-t', self.config.timeout]

        return super().run('restart', *args)


@action('pull', help='Pull docker images.')
class ComposePull(DockerCompose):
    def run(self):
        return super().run('pull')


@action('upgrade', help='Upgrade the database using Alembic.')
class AlembicUpgrade(DockerCompose):
    def run(self):
        args = ['-T', '--workdir', '/api', 'api', 'alembic', 'upgrade', 'head']
        return super().run('exec', *args)


@action('downgrade', help='Downgrade the database using Alembic.')
class AlembicDowngrade(DockerCompose):
    def run(self):
        args = ['-T', '--workdir', '/api', 'api', 'alembic', 'downgrade', '-1']
        return super().run('exec', *args)


@action('revision', help='Create a new revision of the database.')
class AlembicRevision(DockerCompose):
    @classmethod
    def configure(cls, parser):
        parser.add_argument('message', help='Specify a name for the revision.')

    def run(self):
        args = ['/api', 'api', 'alembic', 'revision', '--autogenerate', '-m', self.config.message]
        result = super().run('exec', '--workdir', *args)
        super().run('exec', '--workdir', '/api/alembic/versions', 'api', 'chown', '-R', os.getuid(), '.')
        return result


@action('test-setup', help='Setup the test environment.')
class TestSetup(TestCommand):
    def run(self):
        super(TestCommand, self).run('up', '-d', 'db', exit=True)
        time.sleep(0.5)  # Make sure the database is ready. Prevent the next command to fail.
        super(TestCommand, self).run('run', '-T', '--rm', '--workdir', '/api', 'api', 'alembic', 'upgrade', 'head')


@action('test-back', help='Setup the test environment.')
class TestBack(TestCommand):
    def run(self):
        if not self.config.exit:
            super(TestCommand, self).run('build', 'api', exit=True)

        return super(TestCommand, self).run('run', '--rm', 'api', exit=self.config.exit)


@action('test-cleanup', help='Cleanup the test environment.')
class TestCleanup(TestCommand):
    def run(self):
        super(TestCommand, self).run('down', exit=True)
        return super(DockerCompose, self).run('docker', 'volume', 'rm', f'{self.project}_postgres_data')


@action('tests', help='Cleanup the test environment.')
class RunTests(TestSetup, TestBack, TestCleanup):
    def run(self):
        TestSetup.run(self)
        TestBack.run(self)
        return TestCleanup.run(self)


@action('lint', help="Lint the backend's code.")
class LintCommand(TestCommand):
    @classmethod
    def configure(cls, parser):
        parser.add_argument(
            '--diff', action='store_true', dest='diff',
            help='Only check files that have changed since the last commit.'
        )
        return super().configure(parser)

    def run(self):
        if not self.config.exit:
            super().run('build', 'api', stdout=DEVNULL, exit=True)

        pipe = None
        args = ['flake8', '--config', 'api/setup.cfg']
        if self.config.diff:
            pipe, w = os.pipe()
            args.append('--diff')
            super(DockerCompose, self).run('git', 'diff', '-u', stdout=w, exit=True)

        return super().run('run', '--rm', 'api', *args, 'api/', exit=self.config.exit, stdin=pipe)


if __name__ == '__main__':
    parser.add_argument('-p', help='Name of project to use with docker-compose.', dest='project', default='dodobox-ext')
    parser.add_argument('--test', action='store_true', help='Use the test environment.')
    parser.add_argument('--prod', action='store_true', help='Use the production environment.')

    args = parser.parse_args()
    action = actions[args.action](args)

    sys.exit(action.run())
