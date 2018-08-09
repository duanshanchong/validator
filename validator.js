/**
 * Created by duanshanchong on 14/12/12.
 * 表单校验工具
 */
var Validator = function (node, events) {
    var formNode = node || document.body;
    var onValidateField = Validator.config.onValidateField;
    var rules = ruleLib,
        errorMap = {},
        errors = [];

    var isEmptyObject = function (obj) {
        for (var name in obj) {
            return false;
        }
        return true;
    };

    //添加校验规则
    this.addRule = function (newRules) {
        rules = QApp.util.extend({}, rules, newRules);
    };

    this.setOnValidateField = function (func) {
        onValidateField = func;
    };

    this.createMessage = function (fieldName, fieldVal, message, params) {
        var message = message.replace("{name}", fieldName)
            .replace("{val}", fieldVal);
        params.forEach(function (param, i) {
            message = message.replace("{param" + (i + 1) + "}", param);
        });
        return message;
    };

    this.check = function (fieldNode, callback) {
        var fieldName = fieldNode.getAttribute('name');
        var fieldCName = fieldNode.getAttribute('data-validate-cname') || '';
        var fieldValue = fieldNode.value;
        var validations = fieldNode.getAttribute('data-validate').split("|");
        var that = this,
            errorMap = {};

        if (!fieldNode.hasAttribute('disabled')) {
            validations.forEach(function (pattern) {
                var v_params = pattern.trim().split("[");
                var v = v_params[0];
                var params = [];

                if (v_params.length > 1) {
                    params = v_params[1].replace("]", "").split(",");
                }

                if (rules.hasOwnProperty(v)) {
                    if (!rules[v].rule(fieldValue, params, fieldNode)) {
                        if (!errorMap.hasOwnProperty(fieldName)) {
                            errorMap[fieldName] = [];
                        }
                        var message = that.createMessage(fieldCName || fieldName, fieldValue, rules[v].message, params);
                        errorMap[fieldName].push(message);
                    }
                }
            });
        }

        var message = errorMap[fieldName];
        var errorData = {
            message: (message !== undefined && message.length) ? message : null,
            fileName: fieldName,
            filedNode: fieldNode
        };
        callback.call(this, errorData);
    };

    this.getValidateNodes = function () {
        return formNode.querySelectorAll('[data-validate]');
    };
    //通过代理方式绑定事件
    this.bindEvent = function (events) {
        var self = this;
        events.forEach(function (evt) {
            formNode.addEventListener(evt, function (event) {
                var target = event.target;
                if (target.hasAttribute('data-validate')) {
                    self.check(target, function (errorData) {
                        onValidateField(errorData, true);
                    });
                }
            }, true);
        });
    };

    //校验所有
    this.checkAll = function (retFunc) {
        var deferred = new QApp.util.deferred();
        var self = this;
        errors = [];
        var validateNodes = formNode.querySelectorAll('[data-validate]');

        for (var i = 0, L = validateNodes.length; i < L; i++) {
            var values = [];
            var fieldNode = validateNodes[i];
            this.check(fieldNode, function (errorData) {
                if (errorData.message != null) {
                    errors.push(errorData);
                }
                onValidateField.call(self, errorData);
            });
        }

        if (errors.length > 0) {
            deferred.reject(errors);
        } else {
            deferred.resolve(this);
        }
        return deferred;
    };

    this.getRules = function () {
        return rules;
    };

    this.bindEvent(events || Validator.config.fieldEvents);
};


Validator.config = {

    onValidateField: function (errorData, isOnEvent) {

        if (errorData.message) {
            QApp.util.addClass(errorData.filedNode.parentNode, 'g-row-tips');
            if (isOnEvent) {
//                SCM.Mobile.tips(errorData.message[0], 'warning');
            }
        } else {
            QApp.util.removeClass(errorData.filedNode.parentNode, 'g-row-tips');
        }
    },


    fieldEvents: ['blur', 'change']
};


var ruleLib = {
    required: {
        rule: function (val) {
            return val != null && val.match(/[\S]+/);
        },
        message: "{name}不能为空"
    },
    select_required: {
        rule: function (val) {
            return val != null && val.match(/[\S]+/);
        },
        message: "请选择{name}"
    },
    alpha: {
        rule: function (val) {
            return !!val.match(/^[a-zA-z\s]+$/);
        },
        message: "{name}只能包含字母和空格"
    },
    numeric: {
        rule: function (val) {
            return !!val.match(/^[-]?\d+(\.\d+)?$/);
        },
        message: "{name}必须为数值类型"
    },
    mobile: {
        rule: function (val) {
            return !!val.match(/^0?(13[0-9]|15[012356789]|17[67890]|18[0-9]|14[57])[0-9]{8}$/);
        },
        message: '{name}必须为手机格式'
    },
    digit: {
        rule: function (val) {
            return !!val.match(/^\d+$/);
        },
        message: "{name}只允许输入数字"
    },
    alphanumeric: {
        rule: function (val) {
            return !!val.match(/^[a-zA-Z0-9]+$/);
        },
        message: "{name}只允许输入字母和数字"
    },
    email: {
        rule: function (val) {
            return !!val.match(/^([a-zA-Z0-9_\.\-])+(\+[a-zA-Z0-9]+)*\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/);
        },
        message: "{val}不是有效的电子邮箱格式"
    },
    creditcard: {
        rule: function (val) {
            return !!val.match(/^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/);
        },
        message: "{val}不是有效的信用卡格式r"
    },
    alpha_dash: {
        rule: function (val) {
            return !!val.match(/^([-a-z0-9_-])+$/);
        },
        message: "{name}只能包含字母、数字、横线和下划线"
    },
    size: {
        rule: function (val, params) {
            return val.length == params[0];
        },
        message: "{name}长度必须为{param1}个字符."
    },
    between: {
        rule: function (val, params) {
            if (params.length === 3 && params[2] === 'num') {
                val = val * 1;
                if (!(val > params[0] * 1 && val < params[1] * 1)) {
                    this.message = '{name}必须在{param1}和{param2}之间';
                    return false;
                }
            } else {
                val = '' + val;
                if (!(val.length > params[0] * 1 && val.length < params[1] * 1)) {
                    this.message = '{name}长度必须在{param1}和{param2}之间';
                    return false;
                }
            }

            return true;
        },
        message: ''
    },
    min: {
        rule: function (val, params) {
            if (isNaN(val)) {
                return val.length >= parseInt(params[0], 10);
            }
            else {
                return parseInt(val, 10) >= parseInt(params[0], 10);
            }
        },
        message: "{name}应该不小于{param1}"
    },
    min_length: {
        rule: function (val, params) {
            val = String(val);
            return val.length >= parseInt(params[0], 10);
        },
        message: "{name}应该不少于{param1}个字符"
    },
    max: {
        rule: function (val, params) {
            if (isNaN(val)) {
                return val.length <= parseInt(params[0], 10);
            }
            else {
                return parseInt(val, 10) <= parseInt(params[0], 10);
            }
        },
        message: "{name}应该不超过{param1}"
    },
    max_length: {
        rule: function (val, params) {
            val = String(val);
            return val.length <= parseInt(params[0], 10);
        },
        message: "{name}应该不超过{param1}个字符"
    },
    url: {
        rule: function (val) {
            return val.match(/^\b(https?|ftp|file):\/\/[-A-Za-z0-9+&@#\/%?=~_|!:,.;]*[-A-Za-z0-9+&@#\/%=~_|]/);
        },
        message: "{val}不是有效的链接"
    },
    ipaddress: {
        rule: function (val) {
            return val.match(/^(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))$/);
        },
        message: "{val}不是有效的IP地址"
    },
    noequal: {
        rule: function (val) {
            return val != params[0];
        },
        message: "{name}不能为{params1}"
    },
    //中文汉字+字母+数字
    chineseAndLetterAndNumber: {
        rule: function(val){
            return /^[\da-zA-Z\u3400-\u4DB5\u4E00-\u9FCC\uF900-\uFAD9]+$/.test(val) && !(/^\d+$/.test(val))
        },
        message : '{name}只能包含汉字/英文字母/数字,且不能为纯数字'
    },
    //英文地址名称的校验
    englishAddressAndName:{
        rule:function(val){
            return val != null && val.match(/[\S]+/) && (/^[a-zA-Z\d\s,\-\\_()@\.#\/]*$/.test(val))
        },
        message:"{name}不能为空且只支持英文、数字、半角逗号、\\ 、-、_、()、@、. 、#、/"
    }

};

module.exports = Validator;



