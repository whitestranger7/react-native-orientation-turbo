import {
  LandscapeDirection,
  PortraitDirection,
  lockToLandscape,
  lockToPortrait,
  unlockAllOrientations,
} from 'react-native-orientation-turbo';

import type { RunAction } from '../types';
import { ActionButton } from './ActionButton';
import { ButtonRow } from './ButtonRow';

const LOCK_ACTIONS = [
  {
    title: 'Portrait',
    api: 'lockToPortrait()',
    call: () => lockToPortrait(),
  },
  {
    title: 'Portrait upside down',
    api: 'lockToPortrait(UPSIDE_DOWN)',
    call: () => lockToPortrait(PortraitDirection.UPSIDE_DOWN),
  },
  {
    title: 'Landscape left',
    api: 'lockToLandscape(LEFT)',
    call: () => lockToLandscape(LandscapeDirection.LEFT),
  },
  {
    title: 'Landscape right',
    api: 'lockToLandscape(RIGHT)',
    call: () => lockToLandscape(LandscapeDirection.RIGHT),
  },
  {
    title: 'Unlock all',
    api: 'unlockAllOrientations()',
    call: () => unlockAllOrientations(),
  },
];

type Props = {
  run: RunAction;
  // Appended to the log label, e.g. " (in Modal)"
  context?: string;
};

export function LockButtons({ run, context = '' }: Props) {
  return (
    <ButtonRow>
      {LOCK_ACTIONS.map(({ title, api, call }) => (
        <ActionButton
          key={title}
          title={title}
          onPress={() => run(`${api}${context}`, call)}
        />
      ))}
    </ButtonRow>
  );
}
