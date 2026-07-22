/**
 * Credify Core — client-side state engine for the "Golden Path"
 * (Calculator -> Credit Check -> Application hydration).
 *
 * Backed by localStorage so state survives navigation between pages.
 * Exposes window.CredifyEngine with the interface already used by
 * apply.html and (eventually) calculator.html / credit-score.html.
 */
(function () {
    const STORAGE_KEY = 'credify_engine_state_v1';

    // Indicative APR bands by risk tier — placeholder business logic until
    // a real credit-check backend/service is wired in.
    const APR_BY_TIER = {
        excellent: 10.5,
        good: 13.5,
        fair: 17.5,
        poor: 22.0,
    };
    const DEFAULT_TIER = 'fair';

    function readState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (err) {
            console.error('CredifyEngine: failed to read state', err);
            return {};
        }
    }

    function writeState(partial) {
        try {
            const next = { ...readState(), ...partial, updatedAt: new Date().toISOString() };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
        } catch (err) {
            console.error('CredifyEngine: failed to write state', err);
            return readState();
        }
    }

    window.CredifyEngine = {
        /** Call from a loan-type page's Apply button, or apply.html on load. */
        setLoanType(loanType) {
            return writeState({ loanType });
        },

        /** Call from calculator.html once the user has an amount/tenure picked. */
        setCalculatorInputs({ principal, tenureMonths } = {}) {
            return writeState({ requestedLoanAmount: principal, tenureMonths });
        },

        /** Call from credit-score.html once a risk tier is known. */
        setRiskTier(tier) {
            const applicableAPR = APR_BY_TIER[tier] ?? APR_BY_TIER[DEFAULT_TIER];
            return writeState({ riskTier: tier, applicableAPR });
        },

        setMonthlyIncome(monthlyIncome) {
            return writeState({ monthlyIncome });
        },

        /**
         * Returns the current stored state. If a ?type= query param is present
         * on the current URL, it overrides loanType — this keeps direct links
         * like "apply.html?type=Personal+Loan" working even from pages that
         * haven't been updated to call setLoanType() yet.
         */
        getApplicationData() {
            const state = readState();
            try {
                const params = new URLSearchParams(window.location.search);
                const urlType = params.get('type');
                if (urlType) state.loanType = urlType;
            } catch (err) {
                // no-op outside a browser context
            }
            return state;
        },

        evaluateEligibility() {
            const state = readState();
            const applicableAPR = state.applicableAPR || APR_BY_TIER[DEFAULT_TIER];
            return { applicableAPR, riskTier: state.riskTier || DEFAULT_TIER };
        },

        /** Standard amortized monthly payment. */
        calculateMonthlyPayment(principal, aprPercent, years) {
            const P = parseFloat(principal);
            const n = parseFloat(years) * 12;
            const r = (parseFloat(aprPercent) / 100) / 12;
            if (!P || !n) return 0;
            if (!r) return Math.round(P / n);
            const factor = Math.pow(1 + r, n);
            return Math.round(P * r * (factor / (factor - 1)));
        },

        clearState() {
            try {
                localStorage.removeItem(STORAGE_KEY);
            } catch (err) {
                console.error('CredifyEngine: failed to clear state', err);
            }
        },
    };
})();