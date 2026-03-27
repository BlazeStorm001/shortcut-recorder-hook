import { renderHook, act } from '@testing-library/react';
import useShortcutRecorder from '../src/hook';

// Function to trigger key events
const dispatchKeyDown = (code: string) => {
    document.dispatchEvent(new KeyboardEvent('keydown', { code }));
};

const dispatchKeyUp = (code: string) => {
    document.dispatchEvent(new KeyboardEvent('keyup', { code }));
};

describe('useShortcutRecorder - Platform Cases', () => {
    test('special MacOS Meta key handling', () => {
        const originalUserAgent = navigator.userAgent;
        const originalPlatform = navigator.platform;

        // Mock MacOS environment
        Object.defineProperty(navigator, 'userAgent', { get: () => 'Macintosh', configurable: true });
        Object.defineProperty(navigator, 'platform', { get: () => 'MacIntel', configurable: true });

        const { result } = renderHook(() => useShortcutRecorder());
        act(() => result.current.startRecording());

        act(() => { dispatchKeyDown('MetaLeft'); });
        act(() => { dispatchKeyDown('KeyC'); });
        act(() => { dispatchKeyUp('MetaLeft'); });

        expect(result.current.savedShortcut).toEqual(['Meta', 'KeyC']);

        // Clean up
        Object.defineProperty(navigator, 'userAgent', { get: () => originalUserAgent, configurable: true });
        Object.defineProperty(navigator, 'platform', { get: () => originalPlatform, configurable: true });
    });

    test('non-MacOS Meta (Windows Key) behavior', () => {
        const originalUserAgent = navigator.userAgent;
        const originalPlatform = navigator.platform;

        Object.defineProperty(navigator, 'userAgent', { get: () => 'Windows', configurable: true });
        Object.defineProperty(navigator, 'platform', { get: () => 'Win32', configurable: true });

        const { result } = renderHook(() => useShortcutRecorder());
        act(() => result.current.startRecording());
        act(() => { dispatchKeyDown('MetaLeft'); });
        act(() => { dispatchKeyDown('KeyS'); });

        act(() => { dispatchKeyUp('MetaLeft'); });
        // Should NOT commit yet
        expect(result.current.savedShortcut).toEqual([]);

        act(() => { dispatchKeyUp('KeyS'); });
        expect(result.current.savedShortcut).toEqual(['KeyS']);

        Object.defineProperty(navigator, 'userAgent', { get: () => originalUserAgent, configurable: true });
        Object.defineProperty(navigator, 'platform', { get: () => originalPlatform, configurable: true });
    });
});

