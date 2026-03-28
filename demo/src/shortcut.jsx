import { useShortcutRecorder } from 'use-shortcut-recorder';

export default function ShortcutInput() {
  const {
    shortcut,
    savedShortcut,
    isRecording,
    error,
    startRecording,
    stopRecording,
    resetRecording,
    clearLastRecording,
  } = useShortcutRecorder({
    onChange: (newShortcut) => {
      console.log('Shortcut changed:', newShortcut);
    },
    excludedKeys: ['KeyA', 'KeyB'],
    excludedShortcuts: [
      ['Alt', 'KeyM'],
      ['Meta', 'BracketLeft'],
    ],
    excludedModKeys: [''],
    maxModKeys: 1,
    minModKeys: 0,
  });

  return (
    <div className="shortcut-container">
      <label htmlFor="shortcut-input">Enter Shortcut:</label>

      <input
        id="shortcut-input"
        type="text"
        className="shortcut-input"
        placeholder={
          isRecording ? 'Key Recording Started..' : 'Click to Record Shortcut..'
        }
        onFocus={startRecording}
        onClick={startRecording}
        onBlur={stopRecording}
        value={isRecording ? shortcut.join(' + ') : savedShortcut.join(' + ')}
        readOnly={true}
      />

      {error && <div>{error.message}</div>}

      {savedShortcut && (
        <div>
          Saved Shortcut: <strong>{savedShortcut.join(' + ')}</strong>
        </div>
      )}
      <button onClick={clearLastRecording}>Reset</button>
    </div>
  );
}
