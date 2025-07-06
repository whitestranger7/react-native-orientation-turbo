import { useState, useEffect, useRef } from 'react';
import {
  Text,
  View,
  StyleSheet,
  Button,
  type EventSubscription,
} from 'react-native';
import {
  lockToLandscape,
  lockToPortrait,
  unlockAllOrientations,
  LandscapeDirection,
  getCurrentOrientation,
  isLocked,
  onOrientationChange,
  type OrientationSubscription,
} from 'react-native-orientation-turbo';

export default function App() {
  const [orientation, setOrientation] =
    useState<OrientationSubscription | null>(null);
  const listenerSubscription = useRef<null | EventSubscription>(null);

  useEffect(() => {
    listenerSubscription.current = onOrientationChange((subscription) => {
      setOrientation(subscription);
    });

    return () => {
      listenerSubscription.current?.remove();
      listenerSubscription.current = null;
    };
  }, []);

  console.log(orientation);

  return (
    <View style={styles.container}>
      <Text>Result: WELCOME</Text>
      <View>
        <Button title="Lock to Portrait" onPress={lockToPortrait} />
        <Button
          title="Lock to Landscape Left"
          onPress={() => lockToLandscape(LandscapeDirection.LEFT)}
        />
        <Button
          title="Lock to Landscape Right"
          onPress={() => lockToLandscape(LandscapeDirection.RIGHT)}
        />
        <Button
          title="Unlock All Orientations"
          onPress={unlockAllOrientations}
        />
        <Button
          title="Get Current Orientation"
          onPress={() => console.log(getCurrentOrientation())}
        />
        <Button title="Is Locked" onPress={() => console.log(isLocked())} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
