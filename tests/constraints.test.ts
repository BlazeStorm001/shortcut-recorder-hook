import { renderHook, act } from '@testing-library/react';
import useShortcutRecorder from '../src/hook';
import { ShortcutRecorderErrorCode } from '../src/types';

// Function to trigger key events
const dispatchKeyDown = (code: string) => {
    document.dispatchEvent(new KeyboardEvent('keydown', { code }));
};

const dispatchKeyUp = (code: string) => {
    document.dispatchEvent(new KeyboardEvent('keyup', { code }));
};

describe('useShortcutRecorder - Validation & Constraints', () => {
    test('check excluded shortcuts', () => {
        const { result } = renderHook(() => useShortcutRecorder({
            excludedShortcuts: [['Space', 'Alt', 'Control']],
        }));

        act(() => result.current.startRecording());
        act(() => { dispatchKeyDown('AltLeft'); });
        act(() => { dispatchKeyDown('Space'); });
        act(() => { dispatchKeyDown('ControlLeft'); });
        act(() => { dispatchKeyUp('Space'); });

        expect(result.current.error.code).toEqual(ShortcutRecorderErrorCode.SHORTCUT_NOT_ALLOWED);
        expect(result.current.savedShortcut).toEqual([]);
    });

    test('check excluded modifier keys', () => {
        const { result } = renderHook(() => useShortcutRecorder({
            excludedModKeys: ['Control']
        }));

        act(() => result.current.startRecording());
        act(() => { dispatchKeyDown('ShiftLeft'); });
        act(() => { dispatchKeyDown('Space'); });
        act(() => { dispatchKeyDown('ControlLeft'); });

        expect(result.current.error.code).toEqual(ShortcutRecorderErrorCode.MOD_KEY_NOT_ALLOWED);
        expect(result.current.shortcut).toEqual(['Shift', 'Space']);
    });

    test('check excluded keys', () => {
        const { result } = renderHook(() => useShortcutRecorder({
            excludedKeys: ['KeyA']
        }));

        act(() => result.current.startRecording());
        act(() => { dispatchKeyDown('ShiftLeft'); });
        act(() => { dispatchKeyDown('KeyA'); });

        expect(result.current.error.code).toEqual(ShortcutRecorderErrorCode.KEY_NOT_ALLOWED);
        expect(result.current.shortcut).toEqual(['Shift']);
    });

    test('check minimum modifier keys', () => {
        const { result } = renderHook(() => useShortcutRecorder({
            minModKeys: 1
        }));

        act(() => result.current.startRecording());
        act(() => { dispatchKeyDown('KeyA'); });
        act(() => { dispatchKeyUp('KeyA'); });

        expect(result.current.error.code).toEqual(ShortcutRecorderErrorCode.MIN_MOD_KEYS_REQUIRED);
        expect(result.current.shortcut).toEqual([]);
    });

    test('check maximum modifier keys', () => {
        const { result } = renderHook(() => useShortcutRecorder({
            maxModKeys: 1
        }));

        act(() => result.current.startRecording());
        act(() => { dispatchKeyDown('ShiftLeft'); });
        act(() => { dispatchKeyDown('MetaLeft'); });

        expect(result.current.error.code).toEqual(ShortcutRecorderErrorCode.MAX_MOD_KEYS_EXCEEDED);
        expect(result.current.shortcut).toEqual(['Shift']);
    });

    test('defensive range handling (clamping min/max keys)', () => {
        const { result } = renderHook(() => useShortcutRecorder({
            minModKeys: -1,
            maxModKeys: 10
        }));

        act(() => result.current.startRecording());
        act(() => { dispatchKeyDown('ShiftLeft'); });
        act(() => { dispatchKeyDown('KeyA'); });

        expect(result.current.shortcut).toEqual(['Shift', 'KeyA']);
    });
});
