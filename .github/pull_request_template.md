## Summary

<!-- What does this change and why? -->

## Related issues

<!-- e.g. Closes #123 / Refs #456 -->

## Platforms

- [ ] iOS
- [ ] Android
- [ ] JavaScript / TypeScript only

## Checklist

- [ ] `yarn lint`, `yarn typecheck` and `yarn test` pass
- [ ] **Example app updated** for this change (new/changed API, scenario to reproduce the fix) and it builds on iOS + Android (CI `build-ios` / `build-android` green)
- [ ] **Compatible with React Native 0.80 – 0.88**, following the [compatibility rules](https://github.com/whitestranger7/react-native-orientation-turbo/blob/main/CONTRIBUTING.md#compatibility) (no newer RN APIs, new OS APIs guarded, works with AppDelegate-only and SceneDelegate apps)
- [ ] Manual tests from [docs/TESTING.md](https://github.com/whitestranger7/react-native-orientation-turbo/blob/main/docs/TESTING.md) run on the affected devices. Test IDs: <!-- e.g. T3, T4 on D1 + D4 -->
- [ ] Docs updated (README / `docs/`), including the "Known issues" table in `docs/TESTING.md` if a known issue was fixed
- [ ] Breaking change? Commit marked with `!` and described in `docs/MIGRATION.md`
