export enum LandscapeDirection {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export enum PortraitDirection {
  UP = 'UP',
  UPSIDE_DOWN = 'UPSIDE_DOWN', // not supported on iPhones with Face ID
}

export enum Orientation {
  PORTRAIT = 'PORTRAIT',
  LANDSCAPE_LEFT = 'LANDSCAPE_LEFT',
  LANDSCAPE_RIGHT = 'LANDSCAPE_RIGHT',
  PORTRAIT_UPSIDE_DOWN = 'PORTRAIT_UPSIDE_DOWN',
  FACE_UP = 'FACE_UP', // iOS only
  FACE_DOWN = 'FACE_DOWN', // iOS only
}
