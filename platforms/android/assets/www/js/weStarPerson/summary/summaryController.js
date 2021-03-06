/** 
 * @author zoe
 * @description It is the summary controller for my profile summary view .
 * Created at 2016/6/24  
 */
define(["app"], function(app) {
    var bindings = [
        { element: '.we-star-person', event: 'click', handler: openNewPage } ,
        // { element: '.edit-head-photo', event: 'click', handler: openPhotoPage },
    ];
    var query_;
    /**
     * init controller
     */
    function init(param){
        var id = '';
        if(param.id !== undefined){
            id = param.id;
        }
        var renderObject = {
            selector : $('.person-summary'),
            hbsUrl : "js/weStarPerson/summary/summary",
            model : {},
            bindings : bindings,
            beforeRender : weixin_hideBackButton
        }
        setPersonalProfile(renderObject,id);
    }

    return {
        init: init,
        setPersonalProfile : setPersonalProfile,
        openPhotoPage : openPhotoPage
    };

    /**
     * set personal profile
     * @param {Object} view  : hbs view
     * @param {Object} model : data model for hbs templete
     * @param {Array} binds : listeners for view
     */
    function setPersonalProfile(renderObject,id){
        /**
         * on ajax service success
         * @param  {Object} data : success data 
         */
        var onSuccess =  function(data){
            closeLoading();
            var model_= renderObject.model;
            if(data.status === "1" || data.status === 1){
                var photo=data.data.profile.photo;
                if(photo &&''!== photo && photo.indexOf(Star_imgUrl)< 0){
                    photo = photo.replace(/\s/g,'%20');
                    data.data.profile.photo = Star_imgUrl + photo;
                }
                if(id !== undefined && id !== ''){
                    store.set('selected_person',data.data);
                    model_.isOther = true;
                }else{
                    storeWithExpiration.set('ee_person',data.data);
                }
               
                var detailArray = _.pairs(_.omit(data.data,"profile"));
                model_.detailArray = detailArray;
                model_.card=data.data.profile;
            }else{
                if(id !== undefined && id !== ''){
                    app.f7.alert(data.message);
                }else{
                    app.f7.alert(data.message, function(){
                        app.mainView.router.load({url:"index.html"});
                    });
                }
                
            }
            renderObject.model = model_;
            viewRender(renderObject);
        };

        /**
         * on ajax service failed
         * @param  {Object} e : error object
         */
        var onError = function(e){
            closeLoading();
            app.f7.alert(getI18NText('network-error'));
        }

        /**
         * on ajax service success,to reset data in store
         * @param  {Object} data : success data 
         */
        var onRestData = function(data){
            if(data.status === "1" || data.status === 1){
                var photo=data.data.profile.photo;
                if(photo &&''!==photo && photo.indexOf(Star_imgUrl)< 0){
                    data.data.profile.photo = Star_imgUrl + photo;
                }
                storeWithExpiration.set('ee_person',data.data)
            }else{
                app.f7.alert(data.message, function(){
                    app.mainView.router.load({url:"index.html"});
                });
            }
        }

        var url = ess_getUrl("humanresource/HumanResourceWebsvcService/getEmployeeProfile/");
        if(id !== undefined && id !== ''){
            var data = {
                "argsJson": JSON.stringify({
                    "id": id
                })
            }
            getAjaxData(url , onSuccess, onError, data);
        }else{
            if(!storeWithExpiration.get("ee_person") ){
                showLoading();
                getAjaxData(url , onSuccess, onError);
            }else{
                var data = {
                    status :  1,
                    data : storeWithExpiration.get("ee_person")
                }
                onSuccess(data);
                getAjaxData(url,onRestData, onError);
            }
        }
    }

    /**
     * open detai page of my profile
     * @param  {Object} e :click event
     */
    function openNewPage(e){
        var id=$(e.currentTarget).attr("toPage");
        var isOther=$(e.currentTarget).attr("isOther");
        var addStr = '';
        if(isOther === 'true'){
            addStr = "&isOther=true"
        }
        var title=$.trim($(e.currentTarget).find(".wx-name").html());
        app.mainView.router.load({url:'./js/weStarPerson/detail/detail.html?id='+id+"&title="+title+addStr})
    }
    /** 
     * open photo edit page
     */
    function openPhotoPage(){
        query_ = storeWithExpiration.get("ee_person").profile
        var browser = localStorage.getItem("isWeixin");
        if(browser!= null) {
            if(browser=="1")
                app.router.load("weixin_index/editPhoto",{controllerName:"personInfo",photo:query_.photo,ee_id:query_.id.toString(),photo_width:$(this)[0].offsetWidth},"weixin_index");
        }
        else {
            app.router.load("editPhoto",{photo:query_.photo,ee_id:query_.id.toString(),photo_width:$(this)[0].offsetWidth});
        }
    }
});