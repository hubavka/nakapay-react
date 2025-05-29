"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NakaPayModal = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var NakaPayModal = function (_a) {
    var payment = _a.payment, onClose = _a.onClose, onPaymentSuccess = _a.onPaymentSuccess, onPaymentError = _a.onPaymentError, _b = _a.pollInterval, pollInterval = _b === void 0 ? 2000 : _b, _c = _a.statusEndpoint, statusEndpoint = _c === void 0 ? '/api/payment-status' : _c;
    var _d = (0, react_1.useState)(payment.status), currentStatus = _d[0], setCurrentStatus = _d[1];
    var _e = (0, react_1.useState)(3600), timeLeft = _e[0], setTimeLeft = _e[1]; // 1 hour
    var _f = (0, react_1.useState)(false), copySuccess = _f[0], setCopySuccess = _f[1];
    // Poll payment status
    (0, react_1.useEffect)(function () {
        if (currentStatus !== 'pending')
            return;
        var pollStatus = function () { return __awaiter(void 0, void 0, void 0, function () {
            var response, statusData, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, fetch("".concat(statusEndpoint, "/").concat(payment.id))];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.json()];
                    case 2:
                        statusData = _a.sent();
                        setCurrentStatus(statusData.status);
                        if (statusData.status === 'completed' && onPaymentSuccess) {
                            onPaymentSuccess(statusData);
                        }
                        else if ((statusData.status === 'failed' || statusData.status === 'expired') && onPaymentError) {
                            onPaymentError(new Error("Payment ".concat(statusData.status)));
                        }
                        _a.label = 3;
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        error_1 = _a.sent();
                        console.error('Error polling payment status:', error_1);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        }); };
        var interval = setInterval(pollStatus, pollInterval);
        return function () { return clearInterval(interval); };
    }, [payment.id, currentStatus, onPaymentSuccess, onPaymentError, pollInterval, statusEndpoint]);
    // Countdown timer
    (0, react_1.useEffect)(function () {
        if (currentStatus !== 'pending')
            return;
        var timer = setInterval(function () {
            setTimeLeft(function (prev) {
                if (prev <= 1) {
                    setCurrentStatus('expired');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return function () { return clearInterval(timer); };
    }, [currentStatus]);
    var handleCopyInvoice = function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, navigator.clipboard.writeText(payment.invoice)];
                case 1:
                    _a.sent();
                    setCopySuccess(true);
                    setTimeout(function () { return setCopySuccess(false); }, 2000);
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _a.sent();
                    console.error('Failed to copy invoice:', error_2);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var formatTime = function (seconds) {
        var mins = Math.floor(seconds / 60);
        var secs = seconds % 60;
        return "".concat(mins.toString().padStart(2, '0'), ":").concat(secs.toString().padStart(2, '0'));
    };
    var overlayStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        backdropFilter: 'blur(4px)'
    };
    var modalStyle = {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '32px',
        maxWidth: '400px',
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        position: 'relative'
    };
    return ((0, jsx_runtime_1.jsx)("div", { className: "nakapay-modal-overlay", style: overlayStyle, onClick: onClose, children: (0, jsx_runtime_1.jsxs)("div", { className: "nakapay-modal", style: modalStyle, onClick: function (e) { return e.stopPropagation(); }, children: [(0, jsx_runtime_1.jsx)("button", { onClick: onClose, style: {
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'none',
                        border: 'none',
                        fontSize: '24px',
                        cursor: 'pointer',
                        color: '#666',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }, children: "\u00D7" }), (0, jsx_runtime_1.jsxs)("div", { style: { marginBottom: '24px' }, children: [(0, jsx_runtime_1.jsx)("h3", { style: { margin: '0 0 16px 0', fontSize: '20px', fontWeight: '600', color: '#1a1a1a' }, children: "Lightning Payment" }), (0, jsx_runtime_1.jsxs)("p", { style: { margin: '0', color: '#666', fontSize: '16px' }, children: [payment.amount, " sats (~$", (payment.amount * 0.0005).toFixed(2), ")"] }), (0, jsx_runtime_1.jsx)("p", { style: { margin: '8px 0 0 0', color: '#888', fontSize: '14px' }, children: payment.description })] }), currentStatus === 'pending' && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", { style: {
                                margin: '24px 0',
                                padding: '16px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                                border: '2px solid #e2e8f0'
                            }, children: (0, jsx_runtime_1.jsx)("img", { src: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=".concat(encodeURIComponent(payment.invoice)), alt: "Payment QR Code", style: { width: '200px', height: '200px', borderRadius: '8px' } }) }), (0, jsx_runtime_1.jsx)("div", { style: {
                                margin: '16px 0',
                                padding: '12px',
                                background: '#f5f5f5',
                                borderRadius: '6px',
                                fontFamily: 'monospace',
                                fontSize: '10px',
                                wordBreak: 'break-all',
                                color: '#333',
                                maxHeight: '60px',
                                overflowY: 'auto'
                            }, children: payment.invoice }), (0, jsx_runtime_1.jsx)("button", { onClick: handleCopyInvoice, style: {
                                width: '100%',
                                padding: '12px',
                                margin: '16px 0',
                                background: copySuccess ? '#10B981' : '#F7931A',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'background 0.2s ease'
                            }, children: copySuccess ? 'Copied!' : 'Copy Invoice' }), (0, jsx_runtime_1.jsx)("div", { style: {
                                margin: '16px 0',
                                padding: '12px',
                                background: '#EBF8FF',
                                border: '1px solid #BEE3F8',
                                borderRadius: '6px',
                                color: '#2B6CB0',
                                fontSize: '14px'
                            }, children: (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'center' }, children: [(0, jsx_runtime_1.jsx)("div", { style: {
                                            width: '8px',
                                            height: '8px',
                                            background: '#10B981',
                                            borderRadius: '50%',
                                            marginRight: '8px',
                                            animation: 'pulse 2s infinite'
                                        } }), "Waiting for payment... (", formatTime(timeLeft), ")"] }) })] })), currentStatus === 'completed' && ((0, jsx_runtime_1.jsxs)("div", { style: {
                        background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
                        border: '2px solid #10B981',
                        borderRadius: '12px',
                        padding: '32px',
                        margin: '16px 0'
                    }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '48px', marginBottom: '16px' }, children: "\uD83C\uDF89" }), (0, jsx_runtime_1.jsx)("h3", { style: { color: '#065F46', fontSize: '24px', marginBottom: '12px' }, children: "Payment Successful!" }), (0, jsx_runtime_1.jsxs)("p", { style: { color: '#047857', fontSize: '16px', margin: '0' }, children: ["Your payment of ", payment.amount, " sats has been confirmed."] })] })), (currentStatus === 'failed' || currentStatus === 'expired') && ((0, jsx_runtime_1.jsxs)("div", { style: {
                        background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
                        border: '2px solid #EF4444',
                        borderRadius: '12px',
                        padding: '32px',
                        margin: '16px 0'
                    }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '48px', marginBottom: '16px' }, children: "\u274C" }), (0, jsx_runtime_1.jsxs)("h3", { style: { color: '#7F1D1D', fontSize: '24px', marginBottom: '12px' }, children: ["Payment ", currentStatus === 'failed' ? 'Failed' : 'Expired'] }), (0, jsx_runtime_1.jsx)("p", { style: { color: '#991B1B', fontSize: '16px', margin: '0' }, children: currentStatus === 'failed'
                                ? 'The payment could not be completed.'
                                : 'The payment request has expired.' })] }))] }) }));
};
exports.NakaPayModal = NakaPayModal;
