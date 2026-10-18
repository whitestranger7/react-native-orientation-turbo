# Contributing

Contributions are always welcome, no matter how large or small!

We want this community to be friendly and respectful to each other. Please follow it in all your interactions with the project. Before contributing, please read the [code of conduct](./CODE_OF_CONDUCT.md).

## Prerequisites

This is the toolchain the repository is developed and tested with. It's what you need to work on the library and run the example app. Apps that *use* the library have different (smaller) requirements, see [Requirements](./README.md#requirements) in the README.

| Tool | Version | Notes |
|---|---|---|
| Node.js | v24.19.0 (see [`.nvmrc`](./.nvmrc)) | Any `^22.13`, `^24.3` or `>=26` works (required by React Native 0.88). With [nvm](https://github.com/nvm-sh/nvm): `nvm use` |
| Yarn | 4.x (pinned in `packageManager`) | Enable it with `corepack enable`; don't install Yarn globally |
| Ruby + Bundler | Ruby ≥ 2.6 (tested with 3.3), Bundler 2.6 | Used to run the pinned CocoaPods version |
| CocoaPods | 1.17.0 (pinned in [`example/Gemfile.lock`](./example/Gemfile.lock)) | Always run it through Bundler: `bundle exec pod …` |
| Xcode | 26 or newer (tested with 27.1) | Plus iPhone **and** iPad simulators |
| Java | JDK 17 or newer | Android Studio's bundled JDK (JBR, Java 25) works |
| Android SDK | Platform 37, Build-Tools 37.0.0, NDK 27.1.12297006 | Plus emulator images for a phone and a tablet or foldable (API 36+) |

### Check your setup

```sh
node -v                                  # v24.19.0
corepack enable && yarn -v               # 4.x
cd example && bundle install && bundle exec pod --version && cd ..   # 1.17.0
xcodebuild -version
java -version                            # 17 or newer
```

### Java: point Gradle at a supported JDK

Gradle uses `JAVA_HOME`. The simplest option is Android Studio's bundled JDK:

```sh
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
```

If Android Studio is installed in `~/Applications`, use that path instead. To use a separately installed JDK 17 just for one build:

```sh
JAVA_HOME=$(/usr/libexec/java_home -v 17) yarn example android
```

An `Unsupported class file major version` error means Gradle is running on a JDK it doesn't support.

On the first build, Gradle may also download a JDK 17 toolchain into `~/.gradle/jdks`, because React Native's Gradle setup asks for one. That's expected; you don't need to install it yourself.

### Android SDK packages

Install them from Android Studio (**Settings → Languages & Frameworks → Android SDK**) or with `sdkmanager`:

```sh
sdkmanager "platforms;android-37" "build-tools;37.0.0" "ndk;27.1.12297006"
```

## Development workflow

This project is a monorepo managed using [Yarn workspaces](https://yarnpkg.com/features/workspaces). It contains the following packages:

- The library package in the root directory.
- An example app in the `example/` directory.

To get started with the project, run `yarn` in the root directory to install the required dependencies for each package:

```sh
yarn
```

> Since the project relies on Yarn workspaces, you cannot use [`npm`](https://github.com/npm/cli) for development.

The [example app](/example/) demonstrates usage of the library. You need to run it to test any changes you make.

It is configured to use the local version of the library, so any changes you make to the library's source code will be reflected in the example app. Changes to the library's JavaScript code will be reflected in the example app without a rebuild, but native code changes will require a rebuild of the example app.

If you want to use Android Studio or XCode to edit the native code, you can open the `example/android` or `example/ios` directories respectively in those editors. To edit the Objective-C or Swift files, open `example/ios/OrientationTurboExample.xcworkspace` in XCode and find the source files at `Pods > Development Pods > react-native-orientation-turbo`.

To edit the Java or Kotlin files, open `example/android` in Android studio and find the source files at `react-native-orientation-turbo` under `Android`.

You can use various commands from the root directory to work with the project.

To start the packager:

```sh
yarn example start
```

To run the example app on Android:

```sh
yarn example android
```

To run the example app on iOS:

```sh
yarn example ios
```

To run it on an iPad simulator (pick a name from `xcrun simctl list devices available`):

```sh
yarn example ios --simulator "iPad Pro 13-inch (M4)"
```

After changing native dependencies, reinstall pods and regenerate the Android codegen output:

```sh
yarn sync
```

To confirm that the app is running with the new architecture, you can check the Metro logs for a message like this:

```sh
Running "OrientationTurboExample" with {"fabric":true,"initialProps":{"concurrentRoot":true},"rootTag":1}
```

Note the `"fabric":true` and `"concurrentRoot":true` properties.

Make sure your code passes TypeScript and ESLint. Run the following to verify:

```sh
yarn typecheck
yarn lint
```

To fix formatting errors, run the following:

```sh
yarn lint --fix
```

Remember to add tests for your change if possible. Run the unit tests by:

```sh
yarn test
```

### Manual testing

The example app opens a test screen that exercises the whole API. Changes to native code, the build setup or the public API must be tested by hand on real devices or simulators, following the device and test matrix in **[docs/TESTING.md](docs/TESTING.md)**.

### Commit message convention

We follow the [conventional commits specification](https://www.conventionalcommits.org/en) for our commit messages:

- `fix`: bug fixes, e.g. fix crash due to deprecated method.
- `feat`: new features, e.g. add new method to the module.
- `refactor`: code refactor, e.g. migrate from class components to hooks.
- `docs`: changes into documentation, e.g. add usage example for the module..
- `test`: adding or updating tests, e.g. add integration tests using detox.
- `chore`: tooling changes, e.g. change CI config.

Our pre-commit hooks verify that your commit message matches this format when committing.

### Linting and tests

[ESLint](https://eslint.org/), [Prettier](https://prettier.io/), [TypeScript](https://www.typescriptlang.org/)

We use [TypeScript](https://www.typescriptlang.org/) for type checking, [ESLint](https://eslint.org/) with [Prettier](https://prettier.io/) for linting and formatting the code, and [Jest](https://jestjs.io/) for testing.

Our pre-commit hooks verify that the linter and tests pass when committing.

### Publishing to npm

We use [release-it](https://github.com/release-it/release-it) to make it easier to publish new versions. It handles common tasks like bumping version based on semver, creating tags and releases etc.

To publish new versions, run the following:

```sh
yarn release
```

### Scripts

The `package.json` file contains various scripts for common tasks:

- `yarn`: setup project by installing dependencies.
- `yarn typecheck`: type-check files with TypeScript.
- `yarn lint`: lint files with ESLint.
- `yarn test`: run unit tests with Jest.
- `yarn example start`: start the Metro server for the example app.
- `yarn example android`: run the example app on Android.
- `yarn example ios`: run the example app on iOS.
- `yarn sync`: install dependencies, reinstall pods (pinned CocoaPods via Bundler) and regenerate the Android codegen output.

### Sending a pull request

> **Working on your first pull request?** You can learn how from this _free_ series: [How to Contribute to an Open Source Project on GitHub](https://app.egghead.io/playlists/how-to-contribute-to-an-open-source-project-on-github).

When you're sending a pull request:

- Prefer small pull requests focused on one change.
- Verify that linters and tests are passing.
- Review the documentation to make sure it looks good.
- Follow the pull request template when opening a pull request.
- For pull requests that change the API or implementation, discuss with maintainers first by opening an issue.
