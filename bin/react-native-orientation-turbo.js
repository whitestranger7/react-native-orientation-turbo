#!/usr/bin/env node
'use strict';

const path = require('path');
const {
  LOCKS,
  MANUAL_STEPS,
  README_URL,
  applyPlan,
  planSetup,
} = require('./setup');

const USAGE = `Usage: npx react-native-orientation-turbo setup [options]

Applies the native setup for react-native-orientation-turbo to the app in the current directory.

Options:
  --lock <orientation>  Also lock orientation before React Native starts:
                        ${Object.keys(LOCKS).join(', ')}
  --dry-run             Show what would change without writing anything
  --app-root <path>     App directory (default: current directory)
  -h, --help            Show this help
`;

function parseArgs(argv) {
  const options = {
    command: null,
    lock: null,
    dryRun: false,
    appRoot: process.cwd(),
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') {
      options.help = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--lock') {
      options.lock = argv[++i];
    } else if (arg === '--app-root') {
      options.appRoot = path.resolve(argv[++i] ?? '.');
    } else if (options.command == null && !arg.startsWith('-')) {
      options.command = arg;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  if (options.lock != null && !(options.lock in LOCKS)) {
    throw new Error(
      `Invalid --lock value "${options.lock}". Expected one of: ${Object.keys(LOCKS).join(', ')}`
    );
  }
  return options;
}

function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`${error.message}\n\n${USAGE}`);
    return 2;
  }
  if (options.help || options.command !== 'setup') {
    console.log(USAGE);
    return options.help ? 0 : 2;
  }

  const steps = planSetup({ appRoot: options.appRoot, lock: options.lock });
  const icons = {
    change: options.dryRun ? '•' : '✔',
    done: '✔',
    skipped: '–',
    warning: '!',
    failed: '✖',
  };
  const labels = {
    change: options.dryRun ? 'would change' : 'updated',
    done: 'already set up',
    skipped: 'skipped',
    warning: 'check required',
    failed: 'failed',
  };

  console.log(
    `react-native-orientation-turbo setup${options.dryRun ? ' (dry run)' : ''}\n`
  );
  for (const step of steps) {
    const file = step.file
      ? ` (${path.relative(options.appRoot, step.file)})`
      : '';
    const message =
      step.message && step.status !== 'change' ? `: ${step.message}` : '';
    console.log(
      `${icons[step.status]} ${step.platform} – ${step.title}${file} — ${labels[step.status]}${message}`
    );
  }

  if (!options.dryRun) {
    applyPlan(steps);
  }

  const failed = steps.filter((step) => step.status === 'failed');
  if (failed.length > 0) {
    console.log(
      '\nSetup was not successful. Please apply these steps manually:\n'
    );
    for (const step of failed) {
      console.log(
        `${step.platform} – ${step.title}:\n${MANUAL_STEPS[step.manual] ?? ''}\n`
      );
    }
    console.log(`Full instructions: ${README_URL}`);
    return 1;
  }

  console.log(
    options.dryRun
      ? '\nDry run: nothing was written.'
      : '\nOrientation setup complete. Rebuild the app (iOS: run `pod install` first).'
  );
  return 0;
}

process.exitCode = main();
