/** 
 * @author zoe
 * @description My leave detail info controller.
 * Created at 2016/6/24  
 */
define(["app"], function(app) {


    var bindings = [{
        element: '.approve-link-actions',
        event: 'click',
        handler: clickAction
    }, {
        element: '.cancel-link-actions',
        event: 'click',
        handler: clickCancel
    }];
    /**
     * Id of the last approve item
     * @type {String}
     */
    var generalId = null;
    /**
     * Id of the main leave item
     * @type {String}
     */
    var id = "";
    var code = 0;
    /**
     * init the controller
     * @param  {Object} query : Object with title,id and code
     */
    function init(query) {
        var title = (query.title ||getI18NText('myself')) + getI18NText('real-leave'); //谁发起的申请
        id = query.id;
        code = parseInt(query.code); //0:我发起的未审批的；1：我发起的审批的；2：待我审批的；3：我已审批的

        $('.my-leave-detail-info').text(title);
        initKeyBoardEvent();
        showLoading();
        var model_ = {
                isNull: false,
                code: code
            }
            /**
             * on ajax service success
             * @param  {Object} data : success data 
             */
        var onSuccess = function(data) {
                closeLoading();
                if (parseInt(data.status) === 1) {
                    if (data.data === undefined || (data.data && data.data.length === 0)) {
                        model_.isNull = true;
                    } else {
                        model_.data = data.data;
                        model_.data.flowPerson = [];
                        if (data.data.applyPerson !== undefined) {
                            data.data.applyPerson = dealImage([data.data.applyPerson], true)[0];
                            model_.data.flowPerson.push(data.data.applyPerson);
                            if (data.data.approvePerson !== undefined && data.data.approvePerson.length !== 0) {
                                generalId = data.data.approvePerson[data.data.approvePerson.length - 1].id;
                                data.data.approvePerson = dealImage(data.data.approvePerson, true);
                                model_.data.flowPerson = model_.data.flowPerson.concat(data.data.approvePerson)
                            }
                        }
                    }
                } else {
                    app.f7.alert(data.message);
                }
                var afterRender = function() {
                    if (model_.data && model_.data.flowPerson !== undefined && model_.data.flowPerson !== null) {
                        var heightTop = $('.one-item').first().find('.status-img').offset().top;
                        var heightBottom = $('.one-item').last().find('.status-img').offset().top;
                        var height = heightBottom - heightTop + 40;
                        $('.flow-line').height(height);
                    }
                }
                var renderObject = {
                    selector: $('.myleavedetailinfo'),
                    hbsUrl: "js/myLeave/myLeaveDetailInfo/myLeaveDetailInfo",
                    model: model_,
                    bindings: bindings,
                    beforeRender: weixin_hideBackButton,
                    afterRender: afterRender
                }
                viewRender(renderObject);
            }
            /**
             * on ajax service failed
             * @param  {Object} e : error object
             */
        var onError = function(e) {
            closeLoading();
            app.f7.alert(getI18NText('network-error'));
        }

        var url = ess_getUrl("ess/ELeave/getleaveDetailInfo/") + "&argsJson={\"id\":" + id + "}";
        getAjaxData(url, onSuccess, onError);
    }
    return {
        init: init
    }
    /**
     * init the key board event ,with android system when input focused change the style of the textarea 
     */
    function initKeyBoardEvent() {
        window.addEventListener('native.keyboardshow', function(e) {
            var height = e.keyboardHeight;
            $('.detail-edit-content').addClass("focused");
            $('.detail-edit-content').css("bottom", height);
        });
        window.addEventListener('native.keyboardhide', function(e) {
            $('.detail-edit-content').removeClass("focused");
            $('.detail-edit-content').css("bottom", 44);
        });
    }

    /**
     * Click the pass or reject button when approve the item
     * @param  {Object} e click event object
     */
    function clickAction(e) {
        showLoading();
        var actionButton = $('.approve-link-actions');
        var code = $(e.currentTarget).attr("code");
        actionButton.addClass("disable-click");
        var onSuccess = function(data) {
            closeLoading();
            actionButton.removeClass("disable-click");
            if (parseInt(data.status) === 1 && data.data && data.data.status === true) {
                app.f7.alert(getI18NText('approvalSuc'), function() {
                    app.mainView.router.back({
                        url: "./js/myLeave/myLeaveApprove/myLeaveApprove.html",
                        ignoreCache: true,
                        force: true
                    });
                });
            } else {
                var msg = (data.data.message) ? data.data.message : data.message;
                app.f7.alert(msg, function() {
                    app.mainView.router.back({
                        url: "./js/myLeave/myLeaveApprove/myLeaveApprove.html",
                        ignoreCache: true,
                        force: true
                    });
                });
            }
        }

        var onError = function(e) {
            closeLoading();
            actionButton.removeClass("disable-click");
            app.f7.alert(getI18NText('network-error'));
        }

        var url = ess_getUrl("ess/ELeave/ApproveLeaveItem/");
        var reson = $("#leave-reson").val();
        if (reson === null || reson === "") {
            reson = (parseInt(code) === 0) ? getI18NText('approve') : getI18NText('refuse')
        }
        var data = {
            "argsJson": JSON.stringify({
                "id": generalId,
                "resultCode": parseInt(code),
                "msg": reson
            })
        }
        getAjaxData(url, onSuccess, onError, data);
    }
    /**
     * click the cancel button when user self cancel the approvement
     * @param  {Object} e click event object
     */
    function clickCancel(e) {
        showLoading();
        var cancelButton = $('.cancel-link-actions');
        cancelButton.addClass("disable-click");

        var onSuccess = function(data) {
            closeLoading();
            cancelButton.removeClass("disable-click");
            if (parseInt(data.status) === 1 && data.data && data.data.status === true) {
                app.f7.alert(getI18NText('revoke-success'), function() {
                    app.mainView.router.back({
                        url: "./js/myLeave/myLeaveInfo/myLeaveInfo.html",
                        ignoreCache: true,
                        force: true
                    });
                });
            } else {
                var msg = (data.data.message) ? data.data.message : data.message;
                app.f7.alert(msg, function() {
                    app.mainView.router.back({
                        url: "./js/myLeave/myLeaveInfo/myLeaveInfo.html",
                        ignoreCache: true,
                        force: true
                    });
                });
            }
        }

        var onError = function(e) {
            closeLoading();
            cancelButton.removeClass("disable-click");
            app.f7.alert(getI18NText('network-error'));
        }

        var reson = $("#leave-reson").val();
        if (reson === null || reson === "") {
            reson = getI18NText('cancel-apply');
        }
        var url = ess_getUrl("ess/ELeave/CancelAttendanceApply/");
        var data = {
            "argsJson": JSON.stringify({
                "id": parseInt(id),
                "workflowType": "LEAVE",
                "cancelReason": reson
            })
        }
        getAjaxData(url, onSuccess, onError, data);
    }

});