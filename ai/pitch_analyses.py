import sys, json, random

def analyze(path):
    try:
        import librosa, numpy as np, parselmouth
        y, sr = librosa.load(path, sr=None, mono=True)
        if len(y) == 0: raise ValueError("empty")
        # Pitch score
        pitches, _ = librosa.piptrack(y=y, sr=sr, threshold=0.1)
        pv = pitches[pitches > 50]
        pitch = int(min(100, max(0, (1 - min(1, np.std(pv)/(np.mean(pv)+1e-6))) * 100))) if len(pv) else 45
        # Timing score
        try:
            tempo, bf = librosa.beat.beat_track(y=y, sr=sr)
            bt = librosa.frames_to_time(bf, sr=sr)
            timing = int(min(100, max(0, (1 - min(1, np.std(np.diff(bt))/(np.mean(np.diff(bt))+1e-6))) * 100))) if len(bt)>2 else 55
        except: timing = 55
        # Emotion score
        try:
            snd = parselmouth.Sound(path)
            po  = snd.to_pitch()
            pvals = po.selected_array['frequency']
            pvals = pvals[pvals > 0]
            rng  = (np.max(pvals)-np.min(pvals)) if len(pvals) else 0
            rms  = librosa.feature.rms(y=y)[0]
            emotion = int(min(100, max(0, rng/4 + np.std(rms)/(np.mean(rms)+1e-6)*20)))
        except: emotion = 50
        avg = (pitch+timing+emotion)/3
        rank = 'Platinum' if avg>=85 else 'Gold' if avg>=70 else 'Silver' if avg>=55 else 'Bronze'
        return dict(pitch_score=pitch, timing_score=timing, emotion_score=emotion, rank=rank, avg_score=round(avg,1))
    except ImportError:
        p,t,e = random.randint(55,95), random.randint(55,95), random.randint(55,95)
        avg=(p+t+e)/3
        return dict(pitch_score=p, timing_score=t, emotion_score=e,
                    rank='Gold' if avg>=70 else 'Silver', avg_score=round(avg,1), _note='demo')

if __name__ == '__main__':
    if len(sys.argv)<2: print(json.dumps({'error':'no file'})); sys.exit(1)
    print(json.dumps(analyze(sys.argv[1])))
