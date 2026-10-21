'use strict';

const fs = require('fs');
const path = require('path');

const appDir = process.argv[2];
if (!appDir)
  throw new Error('Usage: compat-android-agp9.js <consumer-directory>');
const version = JSON.parse(
  fs.readFileSync(
    path.join(appDir, 'node_modules/react-native/package.json'),
    'utf8'
  )
).version;
if (version !== '0.88.0')
  throw new Error(`Expected RN 0.88.0; found ${version}`);

const propertiesPath = path.join(appDir, 'android/gradle.properties');
const buildPath = path.join(appDir, 'android/app/build.gradle');
let properties = fs.readFileSync(propertiesPath, 'utf8');
let build = fs.readFileSync(buildPath, 'utf8');
for (const flag of ['builtInKotlin', 'newDsl']) {
  const pattern = new RegExp(`^android\\.${flag}=false[ \\t]*$`, 'gm');
  if ([...properties.matchAll(pattern)].length !== 1) {
    throw new Error(`Expected one template android.${flag}=false opt-out`);
  }
  properties = properties.replace(pattern, `android.${flag}=true`);
}
const kotlinPlugin =
  /^apply plugin: ["']org\.jetbrains\.kotlin\.android["'][ \t]*\r?\n/gm;
if ([...build.matchAll(kotlinPlugin)].length !== 1) {
  throw new Error('Expected one template Kotlin Android plugin application');
}
build = build.replace(kotlinPlugin, '');
build += `
// Test-only host migration. Do not patch React Native or the installed library.
tasks.register("verifyOrientationTurboAgp9") {
    doLast {
        def agp = com.android.Version.ANDROID_GRADLE_PLUGIN_VERSION
        if (!agp.startsWith("9.")) throw new GradleException("Expected AGP 9, got " + agp)
        [project, rootProject.project(":react-native-orientation-turbo")].each { target ->
            ["android.builtInKotlin", "android.newDsl"].each { flag ->
                if (target.findProperty(flag)?.toString() != "true") {
                    throw new GradleException(target.path + ": " + flag + " must be true")
                }
            }
            if (target.plugins.hasPlugin("org.jetbrains.kotlin.android") || target.plugins.hasPlugin("kotlin-android")) {
                throw new GradleException(target.path + ": external Kotlin Android plugin is still applied")
            }
            if (target.extensions.findByName("kotlin") == null || target.tasks.findByName("compileDebugKotlin") == null) {
                throw new GradleException(target.path + ": Kotlin compilation is missing")
            }
            println(target.path + ": AGP " + agp + ", builtInKotlin=true, newDsl=true, built-in Kotlin compile task present")
        }
    }
}
`;
fs.writeFileSync(propertiesPath, properties);
fs.writeFileSync(buildPath, build);
console.log(
  'Enabled AGP 9 built-in Kotlin/new DSL in the generated RN 0.88 host; removed its external Kotlin Android plugin.'
);
