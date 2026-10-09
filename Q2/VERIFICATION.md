# Q2 — Tests

```text
node --test Q2/tests/q2.test.cjs
```

31 tests pass. Coverage includes spawning, newest-model transforms, reset,
empty-scene input, button mapping, stale hits, controller cleanup, and HTML syntax.
WebXR sessions and controller inputs in these tests are mocked.

A successful manual run was reported on October 8, 2026. The test device and
emulator configuration were not recorded. Physical-headset hit testing is not
verified by the automated tests or this report.

Desktop mode uses a virtual floor, not native AR hit testing.
