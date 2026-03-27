import { renderHook, act } from '@testing-library/react';
import useShortcutRecorder from '../src/hook';
import { ShortcutRecorderErrorCode } from '../src/types';
import { isMacOS } from '../src/utils';

// Function to trigger key events
const dispatchKeyDown = (code: string) => {
    document.dispatchEvent(new KeyboardEvent('keydown', { code }));
};

const dispatchKeyUp = (code: string) => {
    document.dispatchEvent(new KeyboardEvent('keyup', { code }));
};

describe('useShortcutRecorder - Basic Functionality', () => {
    test('initial default state', () => {
        const { result } = renderHook(() => useShortcutRecorder());

        expect(result.current.shortcut).toEqual([]);
        expect(result.current.savedShortcut).toEqual([]);
        expect(result.current.isRecording).toBe(false);
        expect(result.current.error.code).toEqual(ShortcutRecorderErrorCode.NONE);
    });

    test('single key shortcut registration', () => {
        const { result } = renderHook(() => useShortcutRecorder());

        act(() => {
            result.current.startRecording();
        });

        act(() => {
            dispatchKeyDown('KeyA');
        });

        expect(result.current.shortcut).toEqual(['KeyA']);

        act(() => {
            dispatchKeyUp('KeyA');
        });

        act(() => {
            result.current.stopRecording();
        });

        expect(result.current.savedShortcut).toEqual(['KeyA']);
    });

    test('multiple key combo shortcut registration', () => {
        const { result } = renderHook(() => useShortcutRecorder());

        act(() => {
            result.current.startRecording();
        });

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
            dispatchKeyUp('KeyQ');
        });

        act(() => {
            result.current.stopRecording();
        });

        expect(result.current.savedShortcut).toEqual(['Shift', 'Alt', 'KeyQ']);
    });

    test('sequential recording sessions', () => {
        const { result } = renderHook(() => useShortcutRecorder());

        // Session 1
        act(() => result.current.startRecording());
        act(() => dispatchKeyDown('ShiftLeft'));
        act(() => dispatchKeyDown('KeyA'));
        act(() => dispatchKeyUp('KeyA'));
        expect(result.current.savedShortcut).toEqual(['Shift', 'KeyA']);

        // Session 2
        act(() => result.current.startRecording());
        act(() => dispatchKeyDown('AltLeft'));
        act(() => dispatchKeyDown('KeyB'));
        act(() => dispatchKeyUp('KeyB'));
        expect(result.current.savedShortcut).toEqual(['Alt', 'KeyB']);
    });

    test('no-op session (stop without keys)', () => {
        const { result } = renderHook(() => useShortcutRecorder());

        act(() => result.current.startRecording());
        act(() => result.current.stopRecording());

        expect(result.current.isRecording).toBe(false);
        expect(result.current.savedShortcut).toEqual([]);
    });

    test('onChange omission', () => {
        const { result } = renderHook(() => useShortcutRecorder()); // No onChange

        act(() => result.current.startRecording());
        act(() => dispatchKeyDown('KeyA'));
        act(() => dispatchKeyUp('KeyA'));

        expect(result.current.savedShortcut).toEqual(['KeyA']);
    });

    test('multiple sequential keydowns (last non-mod key wins)', () => {
        const { result } = renderHook(() => useShortcutRecorder());

        act(() => result.current.startRecording());
        act(() => dispatchKeyDown('KeyA'));
        expect(result.current.shortcut).toEqual(['KeyA']);

        act(() => dispatchKeyDown('KeyB'));
        expect(result.current.shortcut).toEqual(['KeyB']);

        act(() => dispatchKeyUp('KeyB'));
        expect(result.current.savedShortcut).toEqual(['KeyB']);
    });

    test('clearLastRecording and resetRecording functionality', () => {
        const onChangeMock = jest.fn();
        const { result } = renderHook(() => useShortcutRecorder({
            onChange: onChangeMock
        }));

        act(() => { result.current.startRecording(); });

        act(() => { dispatchKeyDown('ShiftLeft'); });
        act(() => { dispatchKeyDown('KeyA'); });

        act(() => { result.current.resetRecording(); });

        expect(result.current.shortcut).toEqual([]);
        expect(result.current.isRecording).toBe(true);

        act(() => { dispatchKeyDown('AltLeft'); });
        act(() => { dispatchKeyDown('KeyB'); });
        act(() => { dispatchKeyUp('KeyB'); });

        expect(result.current.savedShortcut).toEqual(['Alt', 'KeyB']);

        act(() => { result.current.clearLastRecording(); });

        expect(result.current.shortcut).toEqual([]);
        expect(result.current.savedShortcut).toEqual([]);
        expect(result.current.isRecording).toBe(false);
        expect(onChangeMock).toHaveBeenLastCalledWith([]);
    });

    test('escape key cancellation during recording', () => {
        const { result } = renderHook(() => useShortcutRecorder());
        act(() => result.current.startRecording());
        act(() => { dispatchKeyDown('ShiftLeft'); });
        act(() => { dispatchKeyDown('KeyA'); });

        expect(result.current.shortcut).toEqual(['Shift', 'KeyA']);

        act(() => dispatchKeyDown('Escape'));

        expect(result.current.isRecording).toBe(false);
        expect(result.current.shortcut).toEqual([]);
        expect(result.current.savedShortcut).toEqual([]);
    });

    test('onChange callback execution', () => {
        const onChangeMock = jest.fn();
        const { result } = renderHook(() => useShortcutRecorder({ onChange: onChangeMock }));

        act(() => result.current.startRecording());
        act(() => { dispatchKeyDown('MetaLeft'); });
        act(() => { dispatchKeyDown('KeyC'); });

        // In MacOS release Meta, in others release C
        act(() => dispatchKeyUp(isMacOS() ? 'MetaLeft' : 'KeyC'));

        expect(onChangeMock).toHaveBeenCalledWith(['Meta', 'KeyC']);
        expect(onChangeMock).toHaveBeenCalledTimes(1);
    });

    test('modifier release ordering', () => {
        const { result } = renderHook(() => useShortcutRecorder());
        act(() => result.current.startRecording());

        act(() => { dispatchKeyDown('ControlLeft'); });
        act(() => { dispatchKeyDown('AltLeft'); });
        act(() => { dispatchKeyDown('ShiftLeft'); });
        act(() => { dispatchKeyDown('KeyA'); });

        expect(result.current.shortcut).toEqual(['Control', 'Shift', 'Alt', 'KeyA']);

        act(() => dispatchKeyUp('AltLeft'));
        expect(result.current.shortcut).toEqual(['Control', 'Shift', 'KeyA']);
    });

    test('prevent key repeat (long press)', () => {
        const { result } = renderHook(() => useShortcutRecorder());
        act(() => result.current.startRecording());
        act(() => { dispatchKeyDown('KeyA'); });
        expect(result.current.shortcut).toEqual(['KeyA']);

        // Repeated event
        act(() => { dispatchKeyDown('KeyA'); });
        expect(result.current.shortcut).toEqual(['KeyA']);
    });

    test('interrupted recording (blur/stop while keys held)', () => {
        const { result } = renderHook(() => useShortcutRecorder());
        act(() => result.current.startRecording());
        act(() => { dispatchKeyDown('ShiftLeft'); });
        act(() => { dispatchKeyDown('KeyA'); });

        act(() => result.current.stopRecording());
        expect(result.current.isRecording).toBe(false);
        expect(result.current.shortcut).toEqual([]);
        expect(result.current.savedShortcut).toEqual([]);
    });

    test('empty or invalid event codes', () => {
        const { result } = renderHook(() => useShortcutRecorder());
        act(() => result.current.startRecording());

        act(() => { document.dispatchEvent(new KeyboardEvent('keydown', { code: '' })); });
        act(() => { document.dispatchEvent(new KeyboardEvent('keydown', { code: undefined })); });

        expect(result.current.shortcut).toEqual([]);
    });

    test('modifier key released before non-modifier key', () => {
        const { result } = renderHook(() => useShortcutRecorder());
        act(() => result.current.startRecording());
        act(() => { dispatchKeyDown('ShiftLeft'); });
        act(() => { dispatchKeyDown('KeyA'); });

        act(() => { dispatchKeyUp('ShiftLeft'); });
        expect(result.current.shortcut).toEqual(['KeyA']);

        act(() => { dispatchKeyUp('KeyA'); });
        expect(result.current.savedShortcut).toEqual(['KeyA']);
    });
});

