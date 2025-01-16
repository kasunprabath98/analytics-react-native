import {
  DestinationPlugin,
  PluginType,
  SegmentAPISettings,
  UpdateType,
} from '@segment/analytics-react-native';
import { Adjust, AdjustConfig } from 'react-native-adjust';
import identify from './methods/identify';
import track from './methods/track';
import reset from './methods/reset';

export class AdjustPlugin extends DestinationPlugin {
  type = PluginType.destination;
  key = 'Adjust';

  private settings: SegmentAPISettings | null = null;
  private hasRegisteredCallback = false;

  // V5 uses `initialize` and `update` method names
  initialize(settings: SegmentAPISettings) {
    this.update(settings);
  }

  update(settings: SegmentAPISettings) {
    const adjustSettings = settings.integrations?.[this.key];

    if (!adjustSettings) {
      return;
    }

    this.settings = adjustSettings;

    const environment = this.settings.setEnvironmentProduction ? 'production' : 'sandbox';
    const adjustConfig = new AdjustConfig(this.settings.appToken, environment);

    if (!this.hasRegisteredCallback) {
      adjustConfig.setAttributionCallback((attribution) => {
        const trackPayload = {
          provider: 'Adjust',
          trackerToken: attribution.trackerToken,
          trackerName: attribution.trackerName,
          campaign: {
            source: attribution.network,
            name: attribution.campaign,
            content: attribution.clickLabel,
            adCreative: attribution.creative,
            adGroup: attribution.adgroup,
          },
        };
        void this.analytics?.track('Install Attributed', trackPayload);
      });
      this.hasRegisteredCallback = true;
    }

    const useDelay = this.settings.setDelay;
    if (useDelay) {
      const delayTime = this.settings.delayTime;
      if (delayTime != null) {
        adjustConfig.setDelayStart(delayTime);
      }
    }

    Adjust.create(adjustConfig);
  }

  identify(event: IdentifyEventType) {
    identify(event);
    return event;
  }

  track(event: TrackEventType) {
    track(event, this.settings!);
    return event;
  }

  reset() {
    reset();
  }
}

