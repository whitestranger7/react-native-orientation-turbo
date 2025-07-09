import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';
import { Text, View, StyleSheet, Button } from 'react-native';
import {
  lockToLandscape,
  lockToPortrait,
  unlockAllOrientations,
  LandscapeDirection,
  getCurrentOrientation,
  isLocked,
} from 'react-native-orientation-turbo';

export const AnotherScreen = () => {
  const { goBack } = useNavigation();

  useEffect(() => {
    lockToLandscape(LandscapeDirection.LEFT);

    return () => {
      unlockAllOrientations();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text>ANOTHER SCREEN</Text>
      <View>
        <Button title="Lock to Portrait" onPress={() => lockToPortrait()} />
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
      <View style={styles.navigationButton}>
        <Button title="Go Back" onPress={goBack} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navigationButton: {
    marginTop: 50,
  },
});
