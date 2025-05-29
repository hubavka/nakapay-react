"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.NakaPayButton = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var NakaPayModal_1 = require("./NakaPayModal");
var NakaPayButton = function (_a) {
    var amount = _a.amount, description = _a.description, metadata = _a.metadata, _b = _a.apiEndpoint, apiEndpoint = _b === void 0 ? '/api/create-payment' : _b, text = _a.text, _c = _a.className, className = _c === void 0 ? '' : _c, _d = _a.style, style = _d === void 0 ? {} : _d, _e = _a.disabled, disabled = _e === void 0 ? false : _e, onPaymentCreated = _a.onPaymentCreated, onPaymentSuccess = _a.onPaymentSuccess, onPaymentError = _a.onPaymentError;
    var _f = (0, react_1.useState)(false), isLoading = _f[0], setIsLoading = _f[1];
    var _g = (0, react_1.useState)(false), showModal = _g[0], setShowModal = _g[1];
    var _h = (0, react_1.useState)(null), payment = _h[0], setPayment = _h[1];
    var handleClick = function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, error, paymentData, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (disabled || isLoading)
                        return [2 /*return*/];
                    setIsLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, 7, 8]);
                    return [4 /*yield*/, fetch(apiEndpoint, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                amount: amount,
                                description: description,
                                metadata: metadata
                            })
                        })];
                case 2:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.json()];
                case 3:
                    error = _a.sent();
                    throw new Error(error.message || 'Failed to create payment');
                case 4: return [4 /*yield*/, response.json()];
                case 5:
                    paymentData = _a.sent();
                    setPayment(paymentData);
                    setShowModal(true);
                    if (onPaymentCreated) {
                        onPaymentCreated(paymentData);
                    }
                    return [3 /*break*/, 8];
                case 6:
                    error_1 = _a.sent();
                    console.error('NakaPay: Payment creation failed:', error_1);
                    if (onPaymentError && error_1 instanceof Error) {
                        onPaymentError(error_1);
                    }
                    return [3 /*break*/, 8];
                case 7:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    var defaultStyle = __assign({ padding: '12px 24px', backgroundColor: '#F7931A', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: disabled || isLoading ? 'not-allowed' : 'pointer', opacity: disabled || isLoading ? 0.6 : 1, transition: 'all 0.2s ease', fontSize: '16px' }, style);
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("button", { onClick: handleClick, disabled: disabled || isLoading, className: "nakapay-button ".concat(className), style: defaultStyle, children: isLoading ? 'Creating Payment...' : text || "Pay ".concat(amount, " sats") }), showModal && payment && ((0, jsx_runtime_1.jsx)(NakaPayModal_1.NakaPayModal, { payment: payment, onClose: function () { return setShowModal(false); }, onPaymentSuccess: onPaymentSuccess, onPaymentError: onPaymentError }))] }));
};
exports.NakaPayButton = NakaPayButton;
