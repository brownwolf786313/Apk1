const {
  withAndroidManifest,
  withDangerousMod,
  withStringsXml,
} = require('@expo/config-plugins');

const fs = require('fs');
const path = require('path');

const ACCESSIBILITY_SERVICE_NAME =
  'com.macybershield.app/.CyberShieldAccessibilityService';

module.exports = function withAccessibility(config) {
  config = withAndroidManifest(config, async (config) => {
    const manifest = config.modResults.manifest;

    const application = manifest.application?.[0];
    if (!application) {
      return config;
    }

    application.service = application.service || [];

    const alreadyExists = application.service.some(
      (service) =>
        service.$ &&
        service.$['android:name'] ===
          'com.macybershield.app.CyberShieldAccessibilityService'
    );

    if (!alreadyExists) {
      application.service.push({
        $: {
          'android:name':
            'com.macybershield.app.CyberShieldAccessibilityService',
          'android:permission':
            'android.permission.BIND_ACCESSIBILITY_SERVICE',
          'android:exported': 'true',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name':
                    'android.accessibilityservice.AccessibilityService',
                },
              },
            ],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name':
                'android.accessibilityservice',
              'android:resource':
                '@xml/cyber_shield_accessibility_config',
            },
          },
        ],
      });
    }

    return config;
  });

  config = withStringsXml(config, async (config) => {
    const resources = config.modResults.resources;
    resources.string = resources.string || [];

    const name = 'shield_accessibility_desc';
    const value =
      'MA Cyber Shield scans links and websites in real time to block phishing pages.';

    const existing = resources.string.find(
      (item) => item.$ && item.$.name === name
    );

    if (existing) {
      existing._ = value;
    } else {
      resources.string.push({
        $: { name },
        _: value,
      });
    }

    return config;
  });

  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const xmlDirectory = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res',
        'xml'
      );

      fs.mkdirSync(xmlDirectory, { recursive: true });

      const accessibilityConfig = `<?xml version="1.0" encoding="utf-8"?>
<accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:accessibilityEventTypes="typeAllMask"
    android:accessibilityFeedbackType="feedbackGeneric"
    android:accessibilityFlags="flagDefault"
    android:canRetrieveWindowContent="true"
    android:description="@string/shield_accessibility_desc"
    android:notificationTimeout="100" />`;

      fs.writeFileSync(
        path.join(
          xmlDirectory,
          'cyber_shield_accessibility_config.xml'
        ),
        accessibilityConfig
      );

      return config;
    },
  ]);

  return config;
};
