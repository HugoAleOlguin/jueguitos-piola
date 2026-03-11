const EffectsManager = (() => {
    let uiSoundsCleanup = null;

    const enableSounds = (enabled) => {
        if (uiSoundsCleanup) {
            uiSoundsCleanup();
            uiSoundsCleanup = null;
        }

        if (!enabled) return;

        let audioCtx = null;
        const getCtx = () => {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            return audioCtx;
        };

        const playPop = () => {
            try {
                const ctx = getCtx();
                const t = ctx.currentTime;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(500, t);
                osc.frequency.linearRampToValueAtTime(470, t + 0.07);

                gain.gain.setValueAtTime(0, t);
                gain.gain.linearRampToValueAtTime(0.03, t + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(t);
                osc.stop(t + 0.1);
            } catch (_) { }
        };

        const playClick = () => {
            try {
                const ctx = getCtx();
                const t = ctx.currentTime;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(640, t);
                osc.frequency.linearRampToValueAtTime(520, t + 0.05);

                gain.gain.setValueAtTime(0, t);
                gain.gain.linearRampToValueAtTime(0.07, t + 0.006);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(t);
                osc.stop(t + 0.1);
            } catch (_) { }
        };

        const HOVER_SELECTOR = '.game-card, .btn, .theme-toggle, .floating-fab, .vs-mode-btn, .minigame-card, .color-btn, .option-card';

        const isEnteringFromOutside = (e) => {
            const target = e.target.closest(HOVER_SELECTOR);
            if (!target) return false;
            const from = e.relatedTarget?.closest(HOVER_SELECTOR);
            return target !== from;
        };

        const abortCtrl = new AbortController();

        document.body.addEventListener('mouseover', (e) => {
            if (isEnteringFromOutside(e)) playPop();
        }, { signal: abortCtrl.signal });

        document.body.addEventListener('click', (e) => {
            if (e.target.closest(HOVER_SELECTOR)) playClick();
        }, { signal: abortCtrl.signal });

        uiSoundsCleanup = () => abortCtrl.abort();
    };

    const disableSounds = () => enableSounds(false);

    return { enableSounds, disableSounds };
})();
