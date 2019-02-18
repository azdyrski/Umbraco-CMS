/**
 * @ngdoc controller
 * @name Umbraco.Editors.DocumentType.EditController
 * @function
 *
 * @description
 * The controller for the content type editor
 */
(function () {
    "use strict";

    function ListViewGridLayoutController($scope, $routeParams, mediaHelper, mediaResource, 
        listViewHelper, mediaTypeHelper, editorService, $location) {

        var vm = this;
        var umbracoSettings = Umbraco.Sys.ServerVariables.umbracoSettings;

        vm.nodeId = $scope.contentId;
        // Use whitelist of allowed file types if provided
        vm.acceptedFileTypes = mediaHelper.formatFileTypes(umbracoSettings.allowedUploadFiles);
        if (vm.acceptedFileTypes === '') {
            // If not provided, we pass in a blacklist by adding ! to the file extensions, allowing everything EXCEPT for disallowedUploadFiles
            vm.acceptedFileTypes = !mediaHelper.formatFileTypes(umbracoSettings.disallowedUploadFiles);
        }

        vm.maxFileSize = umbracoSettings.maxFileSize + "KB";
        vm.activeDrag = false;
        vm.mediaDetailsTooltip = {};
        vm.itemsWithoutFolders = [];
        vm.isRecycleBin = $scope.contentId === '-21' || $scope.contentId === '-20';
        vm.acceptedMediatypes = [];

        vm.dragEnter = dragEnter;
        vm.dragLeave = dragLeave;
        vm.onFilesQueue = onFilesQueue;
        vm.onUploadComplete = onUploadComplete;

        vm.hoverMediaItemDetails = hoverMediaItemDetails;
        vm.selectContentItem = selectContentItem;
        vm.selectItem = selectItem;
        vm.selectFolder = selectFolder;
        vm.goToItem = goToItem;

        function activate() {
            vm.itemsWithoutFolders = filterOutFolders($scope.items);

            //no need to make another REST/DB call if this data is not used when we are browsing the bin
            if ($scope.entityType === 'media' && !vm.isRecycleBin) {
                mediaTypeHelper.getAllowedImagetypes(vm.nodeId).then(function (types) {
                    vm.acceptedMediatypes = types;
                });
            }

        }

        function filterOutFolders(items) {

            var newArray = [];

            if (items && items.length) {

                for (var i = 0; items.length > i; i++) {
                    var item = items[i];
                    var isFolder = !mediaHelper.hasFilePropertyType(item);

                    if (!isFolder) {
                        newArray.push(item);
                    }
                }

            }

            return newArray;
        }

        function dragEnter(el, event) {
            vm.activeDrag = true;
        }

        function dragLeave(el, event) {
            vm.activeDrag = false;
        }

        function onFilesQueue() {
            vm.activeDrag = false;
        }

        function onUploadComplete() {
            $scope.getContent($scope.contentId);
        }

        function hoverMediaItemDetails(item, event, hover) {

            if (hover && !vm.mediaDetailsTooltip.show) {

                vm.mediaDetailsTooltip.event = event;
                vm.mediaDetailsTooltip.item = item;
                vm.mediaDetailsTooltip.show = true;

            } else if (!hover && vm.mediaDetailsTooltip.show) {

                vm.mediaDetailsTooltip.show = false;

            }

        }

        function selectContentItem(item, $event, $index) {
            listViewHelper.selectHandler(item, $index, $scope.items, $scope.selection, $event);
        }

        function selectItem(item, $event, $index) {
            listViewHelper.selectHandler(item, $index, vm.itemsWithoutFolders, $scope.selection, $event);
        }

        function selectFolder(folder, $event, $index) {
            listViewHelper.selectHandler(folder, $index, $scope.folders, $scope.selection, $event);
        }

        function goToItem(node, $event, $index) {
            $event.stopPropagation();
            
            if ($scope.entityType === "content") {
                
                var contentEditor = {
                    id: node.id,
                    submit: function (model) {
                        // update the node
                        node.name = model.contentNode.name;
                        // TODO: node.description = model.contentNode.description;
                        node.published = model.contentNode.hasPublishedVersion;
                        if (entityType !== "Member") {
                            entityResource.getUrl(model.contentNode.id, entityType).then(function (data) {
                                node.url = data;
                            });
                        }
                        editorService.close();
                    },
                    close: function () {
                        editorService.close();
                    }
                };
                editorService.contentEditor(contentEditor);
                
            } else {
                
                // if node.id is 2147483647 (int.MaxValue) use node.key
                $location.path($scope.entityType + '/' + $scope.entityType + '/edit/' + (node.id === 2147483647 ? node.key : node.id));
                
            }
        }

        activate();

    }

    angular.module("umbraco").controller("Umbraco.PropertyEditors.ListView.GridLayoutController", ListViewGridLayoutController);

})();
