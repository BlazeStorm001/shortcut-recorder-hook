import { renderHook, act } from '@testing-library/react';
import useShortcutRecorder from './hook';
import { ShortcutRecorderErrorCode } from './types';
import { isMacOS } from './utils';

// Function to trigger key events
const dispatchKeyDown = (code: string) => {
  document.dispatchEvent(new KeyboardEvent('keydown', { code }));
};

const dispatchKeyUp = (code: string) => {
  document.dispatchEvent(new KeyboardEvent('keyup', { code }));
};

test('check single key shortcut registration', () => {
  const { result } = renderHook(() => useShortcutRecorder({
  }));

  act(() => {
    result.current.startRecording();
  });

  // try various key combinations
  act(() => {
    dispatchKeyDown('KeyA');
  });

  expect(result.current.shortcut).toEqual(['KeyA']);

 
  act(() => {
    dispatchKeyUp('KeyA');
  });

  expect(result.current.shortcut).toEqual(['KeyA']);

  act(() => {
    result.current.stopRecording();
  });


  expect(result.current.savedShortcut).toEqual(['KeyA']);
  
});


test('check multiple key combo shortcut registration', () => {
  const { result } = renderHook(() => useShortcutRecorder({
  }));

  act(() => {
    result.current.startRecording();
  });

  // try various key combinations
  act(() => {
    dispatchKeyDown('AltLeft');

  });

  expect(result.current.shortcut).toEqual(['Alt']);

  act(() => {
    dispatchKeyDown('ShiftLeft');
  });

  expect(result.current.shortcut).toEqual(['Shift', 'Alt']);


  act(() => {
    dispatchKeyDown('KeyQ');
  });

  expect(result.current.shortcut).toEqual(['Shift', 'Alt', 'KeyQ']);


  act(() => {
    dispatchKeyUp('AltLeft');
  });

  expect(result.current.shortcut).toEqual(['Shift', 'KeyQ']);

  act(() => {
    dispatchKeyDown('MetaLeft');
  });

  expect(result.current.shortcut).toEqual(['Shift', 'Meta', 'KeyQ']);

  act(() => {
    dispatchKeyDown('KeyZ');
  });

  expect(result.current.shortcut).toEqual(['Shift', 'Meta', 'KeyZ']);

  act(() => {
    dispatchKeyUp('KeyQ');
  });

  expect(result.current.shortcut).toEqual(['Shift', 'Meta', 'KeyZ']);

  if (isMacOS()) {
    act(() => {
      dispatchKeyUp('MetaLeft');
    });
  } else {
    act(() => {
      dispatchKeyUp('KeyZ');
    });
  }

  act(() => {
    result.current.stopRecording();
  });


  expect(result.current.savedShortcut).toEqual(['Shift', 'Meta', 'KeyZ']);
});


test('check excluded shortcuts', () => {
  const { result } = renderHook(() => useShortcutRecorder({
    excludedShortcuts: [
      ['Space', 'Alt', 'Control'],
    ],
  }));

  act(() => {
    result.current.startRecording();
  });

  act(() => {
    dispatchKeyDown('AltLeft');

  });

  act(() => {
    dispatchKeyDown('Space');
  });

  act(() => {
    dispatchKeyDown('ControlLeft');
  });

  act(() => {
    dispatchKeyUp('Space');

  });

  expect(result.current.error.code).toEqual(ShortcutRecorderErrorCode.SHORTCUT_NOT_ALLOWED);

  expect(result.current.savedShortcut).toEqual([]);

  act(() => {
    result.current.stopRecording();
  });

  expect(result.current.savedShortcut).toEqual([]);

});

test('check excluded modifier keys', () => {
  const { result } = renderHook(() => useShortcutRecorder({
    excludedModKeys: ['Control']
  }));

  act(() => {
    result.current.startRecording();
  });

  act(() => {
    dispatchKeyDown('Shift');
  });

  act(() => {
    dispatchKeyDown('Space');
  });

  act(() => {
    dispatchKeyDown('Control');
  });


  expect(result.current.error.code).toEqual(ShortcutRecorderErrorCode.MOD_KEY_NOT_ALLOWED);

  expect(result.current.shortcut).toEqual(['Shift', 'Space']);


});

test('check excluded keys', () => {
  const { result } = renderHook(() => useShortcutRecorder({
    excludedKeys: ['KeyA']
  }));

  act(() => {
    result.current.startRecording();
  });

  act(() => {
    dispatchKeyDown('Shift');

  });

  act(() => {
    dispatchKeyDown('KeyA');
  });

  expect(result.current.error.code).toEqual(ShortcutRecorderErrorCode.KEY_NOT_ALLOWED);

  expect(result.current.shortcut).toEqual(['Shift']);


});

test('check minimum modifier keys', () => {
  const { result } = renderHook(() => useShortcutRecorder({
    minModKeys: 1
  }));

  act(() => {
    result.current.startRecording();
  });

  act(() => {
    dispatchKeyDown('KeyA');
  });

  act(() => {
    dispatchKeyUp('KeyA');
  });

  expect(result.current.error.code).toEqual(ShortcutRecorderErrorCode.MIN_MOD_KEYS_REQUIRED);

  expect(result.current.shortcut).toEqual([]);

});

test('check maximum modifier keys', () => {
  const { result } = renderHook(() => useShortcutRecorder({
    maxModKeys: 1
  }));

  act(() => {
    result.current.startRecording();
  });


  act(() => {
    dispatchKeyDown('Shift');
  });

  act(() => {
    dispatchKeyDown('Meta');
  });

  expect(result.current.error.code).toEqual(ShortcutRecorderErrorCode.MAX_MOD_KEYS_EXCEEDED);

  expect(result.current.shortcut).toEqual(['Shift']);

});

