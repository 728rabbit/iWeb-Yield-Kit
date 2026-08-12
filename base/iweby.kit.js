/**
 * iwebyKit - A comprehensive JavaScript utility library for building web applications
 * 
 * This class provides a wide range of functionality including:
 * - UI component initialization (date picker, time picker, pagination, modals, etc.)
 * - Form validation and AJAX form submission
 * - File upload management with progress tracking
 * - Dialog/alert/confirm/modal management
 * - Cookie and localStorage handling
 * - Data validation (email, password, date, time, etc.)
 * - Utility functions (formatting, random generation, etc.)
 * 
 * @example
 * // Initialize the kit
 * const iweby = new iwebyKit().init();
 * 
 * // Make an AJAX request
 * iweby.doRequest({
 *     url: '/api/data',
 *     payload: { id: 1 }
 * }, function(response) {
 *     console.log(response);
 * });
 * 
 * // Show a dialog
 * iweby.dialog('<p>Custom content</p>', function() {
 *     console.log('Dialog opened');
 * });
 * 
 * // Use the date picker
 * iweby.datePicker.render('.date-input');
 */
class iwebyKit {
    constructor() {
        // --- Language Configuration ---
        this.currentLangCode = 'en';
        this.language = {
            en: {
                pleaseSelect: 'Please Select',
                noRecordFound: 'No record found',
                btnConfirm: 'OK',
                btnYes: 'Yes',
                btnNo: 'No',
                errorFileType: 'File type is not allowed.',
                errorMaxFileSize: 'Maximum allowed file size is {num}M.',
                errorRequiredAll: 'Please fill out all required fields correctly.',
                errorRequired: 'Please fill out this field correctly.',
                errorPasswordFormat: 'Password must contain at least 6 characters, including upper/lowercase and numbers (e.g. Abc123).',
                errorEmailFormat: 'Invalid email address format.',
                errorNumberFormat: 'Invalid number format.',
                errorDateFormat: 'Invalid date format.',
                errorTimeFormat: 'Invalid time format.',
                errorGE0: 'Value must be greater than or equal to 0.',
                errorGT0: 'Value must be greater than 0.'
            },
            zh_hant: {
                pleaseSelect: '請選擇',
                noRecordFound: '找不到相關記錄',
                btnConfirm: '確定',
                btnYes: '是',
                btnNo: '否',
                errorFileType: '不允許的檔案類型。',
                errorMaxFileSize: '檔案大小不能超過{num}M。',
                errorRequiredAll: '請正確填寫所有必須欄位。',
                errorRequired: '請正確填寫此欄位。',
                errorPasswordFormat: '密碼必須至少包含6個字符，包括大寫/小寫和數字(例如Abc123)。',
                errorEmailFormat: '無效的郵件地址格式。',
                errorNumberFormat: '無效的數字格式。',
                errorDateFormat: '無效的日期格式。',
                errorTimeFormat: '無效的時間格式。',
                errorGE0: '數值必須大於或等於 0。',
                errorGT0: '數值必須大於 0。'
            },
            zh_hans: {
                pleaseSelect: '请选择',
                noRecordFound: '找不到相关记录',
                btnConfirm: '确定',
                btnYes: '是',
                btnNo: '否',
                errorFileType: '不允许的档案类型。',
                errorMaxFileSize: '档案大小不能超过{num}M。',
                errorRequiredAll: '请正确填写所有必须栏位。',
                errorRequired: '请正确填写此栏位。',
                errorPasswordFormat: '密码必须至少包含6个字符，包括大写/小写和数字(例如Abc123)。',
                errorEmailFormat: '无效的邮件地址格式。',
                errorNumberFormat: '无效的数字格式。',
                errorDateFormat: '无效的日期格式。',
                errorTimeFormat: '无效的时间格式。',
                errorGE0: '数值必须大於或等於 0。',
                errorGT0: '数值必须大於 0。'
            }
        };

        // --- Core Properties ---
        this.md5;                           // MD5 hash instance for encryption
        this.csrfToken;                     // CSRF token for request security
        
        this.timer;                         // Timer reference for debouncing
        this.scrollTimer;                   // Timer for scroll events
        this.isBusy = false;                // Flag to prevent concurrent requests

        // --- Component Instances ---
        this.datePicker;                    // Date picker instance
        this.timePicker;                    // Time picker instance

        // --- Uploader State ---
        this.uploaderOptions = {};          // Upload configuration options
        this.uploaderFiles = {};            // Files selected for upload
        this.uploaderFilesIgnore = {};      // Files to ignore (already uploaded/removed)

        // --- Viewport ---
        this.viewerWidth = 0;               // Current viewer width for responsive design
        
        // --- Event System ---
        this.eventMap = {};                 // Custom event handler registry
    }

    /**
     * Initializes the iwebyKit framework
     * Sets up language, CSRF token, event listeners, and initializes components
     * @returns {iwebyKit} The instance for chaining
     */
    init() {
        const thisInstance = this;
        
        // Helper function to safely call window functions if they exist
        const safeCallFunc = (func, args) => {
            if ((typeof window[func]) === 'function') {
                window[func](args);
            }
        };
        
        /**
         * Sets the view mode based on screen width
         * @param {number} width - Current viewport width
         */
        const setViewMode = (width) => {
            const BREAKPOINTS = {
                DESKTOP: 900,
                TABLET: 640
            };

            const MODES = ['desktop', 'tablet', 'mobile'];
            const viewer = document.querySelector('div.iweby-viewer');
            if(viewer) {
                MODES.forEach(mode => viewer.classList.remove(mode));

                let modeClass;
                if (width >= BREAKPOINTS.DESKTOP) {
                    modeClass = 'desktop';
                } else if (width >= BREAKPOINTS.TABLET) {
                    modeClass = 'tablet';
                } else {
                    modeClass = 'mobile';
                }

                viewer.classList.add(modeClass);
            }
        };
        
        // --- DOM Content Loaded ---
        document.addEventListener('DOMContentLoaded', function() {
            // Set current language from HTML lang attribute
            const defaultLang = document.documentElement.lang;
            const htmlLang = (defaultLang ? defaultLang.toLowerCase().replace('-', '_') : 'en');
            if (thisInstance.isValue(htmlLang) && thisInstance.isValue(thisInstance.language[htmlLang])) {
                thisInstance.currentLangCode = htmlLang;
            }
            
            // Initialize MD5 encryption
            thisInstance.md5 = (new iMD5());

            // Set CSRF token from meta tag
            const metaToken = document.querySelector('meta[name="csrf-token"]');
            const csrfTokenContent = metaToken ? metaToken.content : '';
            if (thisInstance.isValue(csrfTokenContent)) {
                const hostname = (location.hostname || '/');
                thisInstance.csrfToken = thisInstance.md5.hash(thisInstance.md5.hash('iweby@' + hostname) + '@' + csrfTokenContent);
            }

            // Initialize body and components
            thisInstance.initBody();
            thisInstance.initComponent();
            
            // Get viewer width
            if(document.querySelector('div.iweby-viewer')) {
                thisInstance.viewerWidth = parseInt(document.querySelector('div.iweby-viewer').offsetWidth);
            }

            // Execute layout and function callbacks after DOM is ready
            setTimeout(function() {
                document.body.style.setProperty('--iscrollbar-width', (window.innerWidth - thisInstance.viewerWidth + 'px'));
                
                setViewMode(thisInstance.viewerWidth);
                
                thisInstance.responsive();
                thisInstance.responsiveTable();
                
                safeCallFunc('iwebyCommonLayout', thisInstance.viewerWidth);
                safeCallFunc('iwebyLayout', thisInstance.viewerWidth);
                safeCallFunc('iwebyChildLayout', thisInstance.viewerWidth);
                safeCallFunc('iwebyExtraLayout', thisInstance.viewerWidth);

                safeCallFunc('iwebyCommonFunc');
                safeCallFunc('iwebyFunc');
                safeCallFunc('iwebyChildFunc');
                safeCallFunc('iwebyExtraFunc');
                
                thisInstance.copyright();
            }, 100);
        });

        // --- Window Load Complete ---
        window.onload = function() {
            setTimeout(function() {
                safeCallFunc('iwebyCommonLayoutEnd', thisInstance.viewerWidth);
                safeCallFunc('iwebyLayoutEnd', thisInstance.viewerWidth);
                safeCallFunc('iwebyChildLayoutEnd', thisInstance.viewerWidth);
                safeCallFunc('iwebyExtraLayoutEnd', thisInstance.viewerWidth);

                safeCallFunc('iwebyCommonFuncEnd');
                safeCallFunc('iwebyFuncEnd');
                safeCallFunc('iwebyChildEnd');
                safeCallFunc('iwebyExtraEnd');
            }, 100);
        };

        // --- Window Resize ---
        window.addEventListener('resize', function() {
            clearTimeout(thisInstance.timer);
            thisInstance.timer = setTimeout(() => {
                if (thisInstance.viewerWidth !== parseInt(document.querySelector('div.iweby-viewer').offsetWidth)) {
                    thisInstance.viewerWidth = parseInt(document.querySelector('div.iweby-viewer').offsetWidth);

                    setViewMode(thisInstance.viewerWidth);
                    
                    thisInstance.responsive();
                    thisInstance.responsiveTable();
                    
                    safeCallFunc('iwebyCommonLayout', thisInstance.viewerWidth);
                    safeCallFunc('iwebyLayout', thisInstance.viewerWidth);
                    safeCallFunc('iwebyChildLayout', thisInstance.viewerWidth);
                    safeCallFunc('iwebyExtraLayout', thisInstance.viewerWidth);
                }
            }, 100);
        });

        // --- Window Scroll ---
        window.addEventListener('scroll', function() {
            clearTimeout(thisInstance.scrollTimer);
            thisInstance.scrollTimer = setTimeout(() => {
                safeCallFunc('iwebyCommonScroll', window.scrollY);
                safeCallFunc('iwebyScroll', window.scrollY);
                safeCallFunc('iwebyChildScroll', window.scrollY);
                safeCallFunc('iwebyExtraScroll', window.scrollY);
            }, 100);
        });
        
        return thisInstance;
    }

    /**
     * Initializes the body structure: adds core class, wraps content in viewer container
     */
    initBody() {
        const thisInstance = this;

        // Add core class to body
        document.body.classList.add('iweby');

        // Wrap all elements except script, noscript, and style in iweby-viewer container
        const wrapper = document.createElement('div');
        wrapper.classList.add('iweby-viewer');
        const bodyChildren = Array.from(document.body.childNodes);
        bodyChildren.forEach(function(node) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                if (!['SCRIPT', 'NOSCRIPT', 'STYLE'].includes(node.tagName.toUpperCase())) {
                    wrapper.appendChild(node);
                }
            }
            else if (node.nodeType === Node.COMMENT_NODE) {
                wrapper.appendChild(node);
            }
        });
        if (wrapper.childNodes.length > 0) {
            document.body.prepend(wrapper);
        }

        // --- Document Click Handler ---
        document.addEventListener('click', function(e) {
            const target = e.target;

            // Handle anchor clicks
            if (target.closest('a')) {
                const href = target.closest('a').getAttribute('href');
                if (!thisInstance.isValue(href) || 
                    thisInstance.isMatch(href, '#') || 
                    thisInstance.isMatch(href, 'javascript:void(0);')  || 
                    thisInstance.isMatch(href, 'javascript:void(0)')) {
                    e.preventDefault();
                    
                    // Hide tips message
                    if (target.closest('div.iweby-tips-message')) {
                        target.closest('div.iweby-tips-message').classList.remove('error');
                        target.closest('div.iweby-tips-message').classList.remove('success');
                        target.closest('div.iweby-tips-message').innerHTML = '';
                    } 
                    
                    // Reset autocomplete input
                    else if (target.closest('a.fill-reset')) {
                        const fillID = target.closest('div.iweby-input-autocomplete').querySelector('input.fill-id');
                        const fillText = target.closest('div.iweby-input-autocomplete').querySelector('input.fill-text');
                        const fillReset = target.closest('div.iweby-input-autocomplete').querySelector('a.fill-reset');
                        fillID.value = '';
                        fillText.value = '';
                        fillText.readOnly = false;
                        fillReset.remove();

                        // Callback
                        const removeCallBack = fillID.getAttribute('data-rfunc');
                        if ((typeof window[removeCallBack]) === 'function') {
                            window[removeCallBack](fillID);
                        }
                    } 
                    
                    // Change page font size
                    else if (target.closest('a.font-switch')) {
                        const newFontSize = target.getAttribute('data-size');
                        if (thisInstance.isValue(newFontSize)) {
                            thisInstance.setCookie('iweb_font_size', newFontSize);
                            document.documentElement.classList.remove(...fontSizeClasses);
                            document.documentElement.classList.add(newFontSize + '-font');
                            fontButtons.forEach(function(e) {
                                e.classList.toggle('current', thisInstance.isMatch(e.getAttribute('data-size'), newFontSize));
                            });
                        }
                    }
                    
                    // Toggle expand area visibility
                    else if (target.closest('a.control-stretch') && target.closest('div.widget.expand')) {
                        if (target.closest('div.widget.expand').classList.contains('show')) {
                            target.closest('div.widget.expand').classList.remove('show');
                        } 
                        else {
                            target.closest('div.widget.expand').classList.add('show');
                        }
                    }
                }
            }

            // Toggle password visibility
            if (target.closest('button.switch-pwd-type')) {
                const InputPwd = target.closest('div.iweby-input').querySelector('input');
                const ShowIconPwd = target.closest('div.iweby-input').querySelector('i.show');
                const HideIconPwd = target.closest('div.iweby-input').querySelector('i.hide');
                if (thisInstance.isMatch(InputPwd.type, 'password')) {
                    InputPwd.type = 'text';
                    ShowIconPwd.style.display = 'block';
                    HideIconPwd.style.display = 'none';
                } 
                else {
                    InputPwd.type = 'password';
                    ShowIconPwd.style.display = 'none';
                    HideIconPwd.style.display = 'block';
                }
            }

            // Hide autocomplete options when clicking outside
            if (!target.closest('div.iweby-input-autocomplete')) {
                document.querySelectorAll('div.iweby-input-autocomplete ul.fill-options').forEach(function(e1) {
                    e1.remove();
                });
            }

            // Toggle select options visibility
            if (!target.closest('div.iweby-select')) {
                document.querySelectorAll('div.iweby-select').forEach(function(e1) {
                    e1.classList.remove('show');
                });
            } 
            else {
                const virtualOptions = target.closest('div.iweby-select').querySelector('div.virtual > div.options > ul');
                if (thisInstance.isValue(virtualOptions)) {
                    if (target.closest('a.result')) {
                        if (target.closest('div.iweby-select').classList.contains('show')) {
                            target.closest('div.iweby-select').classList.remove('show');
                        } 
                        else {
                            target.closest('div.iweby-select').classList.add('show');
                        }
                    }
                    
                    // Close other select dropdowns
                    document.querySelectorAll('div.iweby-select').forEach(function(otherSelector) {
                        const otherOptions = otherSelector.querySelector('div.virtual > div.options > ul');
                        if (otherOptions) {
                            if (!thisInstance.isMatch(otherOptions.getAttribute('data-index'), virtualOptions.getAttribute('data-index'))) {
                                otherSelector.classList.remove('show');
                            }
                        }
                    });

                    // Handle option selection
                    if (target.closest('a') && target.closest('li.node')) {
                        const isMultiple = target.closest('div.iweby-select').classList.contains('iweby-select-multiple');
                        const selectElement = target.closest('div.iweby-select').querySelector('div.real > select');
                        let selectedOptions = [];
                        
                        // Handle multiple selection
                        if (isMultiple) {
                            selectElement.querySelectorAll('option').forEach(function(optionGroup) {
                                if (optionGroup.children.length > 0) {
                                    Array.from(optionGroup.children).forEach(function(option) {
                                        if (option.selected) {
                                            selectedOptions.push(option.value.toString());
                                        }
                                    });
                                }
                                else if (optionGroup.selected) {
                                    selectedOptions.push(optionGroup.value.toString());
                                }
                            });

                            const selectedValue = (target.getAttribute('data-value') || '').toString();
                            if (!selectedOptions.includes(selectedValue)) {
                                selectedOptions.push(selectedValue);
                            } 
                            else {
                                selectedOptions = selectedOptions.filter(function(value) {
                                    return value !== selectedValue;
                                });
                            }

                            // Update the select element with selected options
                            selectElement.querySelectorAll('option').forEach(function(option) {
                                if (selectedOptions.includes(option.value.toString())) {
                                    option.selected = true;
                                } 
                                else {
                                    option.selected = false;
                                }
                            });
                            selectElement.dispatchEvent(new Event('change', {
                                bubbles: true
                            }));

                        }
                        
                        // Handle single selection
                        else {
                            target.closest('div.iweby-select').classList.remove('show');
                            selectElement.value = (target.getAttribute('data-value') || '');
                            selectElement.dispatchEvent(new Event('change', {
                                bubbles: true
                            }));
                        }
                    }
                } 
                else {
                    document.querySelectorAll('div.iweby-select').forEach(function(otherSelect) {
                        otherSelect.classList.remove('show');
                    });
                }
            }
        });

        // --- Document Input Handler ---
        document.addEventListener('input', function(e) {
            const target = e.target;
            // Remove error state on input
            if (target.closest('div.iweby-input')) {
                target.closest('div.iweby-input').classList.remove('error');
                const oriSmallTips = target.closest('div.iweby-input').querySelector('small.tips');
                if (oriSmallTips) {
                    oriSmallTips.remove();
                }
            }

            // Color code synchronization
            if (target.closest('div.iweby-input-color')) {
                if (thisInstance.isMatch(target.type, 'color')) {
                    const inputColorCode = target.closest('div.iweby-input-color').querySelector('input[type="text"]');
                    if (/^#[0-9A-F]{6}$/i.test(target.value)) {
                        inputColorCode.value = target.value;
                    }
                } 
                else {
                    const input = target.closest('div.iweby-input-color').querySelector('input[type="color"]');
                    if (!target.value.startsWith('#')) {
                        target.value = '#' + target.value;
                    }
                    if (/^#[0-9A-F]{6}$/i.test(target.value)) {
                        input.value = target.value;
                    }
                }
            }
            
            // Autocomplete search
            else if (target.closest('div.iweby-input-autocomplete') && target.closest('input.fill-text')) {
                clearTimeout(thisInstance.timer);
                thisInstance.timer = setTimeout(() => {
                    // Remove error, tips & options list
                    target.closest('div.iweby-input-autocomplete').classList.remove('error');
                    const oriSmallTips = target.closest('div.iweby-input-autocomplete').querySelector('small.tips');
                    if (oriSmallTips) {
                        oriSmallTips.remove();
                    }
                    const oriFillOptions = target.closest('div.iweby-input-autocomplete').querySelector('ul.fill-options');
                    if(oriFillOptions) {
                        oriFillOptions.remove();
                    }

                    // Gather extra parameters
                    let extraPayload = {};
                    for (let i = 1; i <= 5; i++) {
                        let param = target.closest('div.iweby-input-autocomplete').querySelector('input.fill-id').getAttribute('data-param' + i);
                        if (thisInstance.isValue(param)) {
                            let [key, value] = param.split(':');
                            extraPayload[key] = value;
                        }
                    }

                    // Prepare request
                    const keywords = target.value;
                    const url = target.closest('div.iweby-input-autocomplete').querySelector('input.fill-id').getAttribute('data-url');
                    const requestData = {
                        url: url,
                        payload: Object.assign({
                            keywords: keywords
                        }, extraPayload),
                        showBusy: false
                    };

                    // Search and display results
                    if (thisInstance.isValue(keywords)) {
                        thisInstance.doRequest(requestData, function(responseData) {
                            if (thisInstance.isValue(responseData)) {
                                responseData = Object.values(responseData);

                                // Create options list
                                const fillOptions = document.createElement('ul');
                                fillOptions.classList.add('fill-options');
                                responseData.forEach(function(value) {
                                    const li = document.createElement('li');
                                    const a = document.createElement('a');
                                    a.setAttribute('data-id', value.id);
                                    a.setAttribute('data-value', (thisInstance.isValue(value.value)?value.value:value.name));
                                    a.textContent = value.name;
                                    a.addEventListener('click', thisInstance.deBounce(function(e1) {
                                        const target = e1.target;
                                        const orifillReset = target.closest('div.iweby-input-autocomplete').querySelector('a.fill-reset');
                                        if(orifillReset) {
                                            orifillReset.remove();
                                        }

                                        // Set id input & search input
                                        const fillID = target.closest('div.iweby-input-autocomplete').querySelector('input.fill-id');
                                        const fillText = target.closest('div.iweby-input-autocomplete').querySelector('input.fill-text');
                                        fillID.value = (target.getAttribute('data-id') || '');
                                        fillText.value = (target.getAttribute('data-value') || '');
                                        fillText.readOnly = true;

                                        // Create reset button
                                        const fillReset = document.createElement('a');
                                        fillReset.classList.add('fill-reset');

                                        // Create Reset icon
                                        const fillResetIcon = document.createElement('i');
                                        fillResetIcon.classList.add('fa', 'fa-times');
                                        fillResetIcon.style.color = '#d73d32';

                                        // Append elements
                                        fillReset.appendChild(fillResetIcon);
                                        fillID.closest('div.iweby-input-autocomplete').appendChild(fillReset);

                                        // Remove error, tips & options list
                                        fillID.closest('div.iweby-input-autocomplete').classList.remove('error');
                                        const oriSmallTips = fillID.closest('div.iweby-input-autocomplete').querySelector('small.tips');
                                        if(oriSmallTips) {
                                            oriSmallTips.remove();
                                        }
                                        const oriFillOptions = fillID.closest('div.iweby-input-autocomplete').querySelector('ul.fill-options');
                                        if(oriFillOptions) {
                                            oriFillOptions.remove();
                                        }

                                        // Callback
                                        const selectCallBack = fillID.getAttribute('data-sfunc');
                                        if ((typeof window[selectCallBack]) === 'function') {
                                            window[selectCallBack](fillID.value, fillID);
                                        }
                                    }));

                                    // Append elements
                                    li.appendChild(a);
                                    fillOptions.appendChild(li);
                                });

                                // Append elements
                                target.closest('div.iweby-input-autocomplete').appendChild(fillOptions);
                            } 
                            else {
                                const fillOptions = document.createElement('ul');
                                fillOptions.classList.add('fill-options');
                                const li = document.createElement('li');
                                li.classList.add('empty');
                                li.textContent = thisInstance.language[thisInstance.currentLangCode]['noRecordFound'];
                                fillOptions.appendChild(li);

                                // Append elements
                                target.closest('div.iweby-input-autocomplete').appendChild(fillOptions);
                            }
                        });
                    }
                }, 1000);
            } 
            
            // Select search filter
            else if (target.closest('div.iweby-select') && target.closest('li.filter')) {
                const fkw = target.value;
                
                // Find all node elements
                if (thisInstance.isValue(fkw)) {
                    target.closest('div.iweby-select').querySelectorAll('div.virtual > div.options ul > li.node > a').forEach(function(anchor) {
                        const textContent = anchor.textContent || anchor.innerText;
                        if (textContent.toLowerCase().indexOf(fkw.toLowerCase()) > -1) {
                            anchor.parentElement.classList.remove('hide');
                            const parentNode = anchor.closest('li.node-parent');
                            if (parentNode) {
                                parentNode.classList.remove('hide');
                            }
                        }
                        else {
                            anchor.parentElement.classList.add('hide');
                        }
                    });
                } 
                
                // If filter is empty, remove 'hide' class from all node elements
                else {
                    target.closest('div.iweby-select').querySelectorAll('div.virtual > div.options ul > li.node').forEach(function(nodeElement) {
                        nodeElement.classList.remove('hide');
                    });
                }
            }
        });

        // --- Document Change Handler ---
        document.addEventListener('change', function(e) {
            const target = e.target;
                
            // Virtual select synchronization
            if (target.closest('div.iweby-select')) {
                let selectedOptions = [];
                let selectedOptionLabel = '';

                // Remove error & tips
                target.closest('div.iweby-select').classList.remove('error');
                const oriSmallTips = target.closest('div.iweby-select').querySelector('small.tips');
                if(oriSmallTips) {
                    oriSmallTips.remove();
                } 

                // Traverse through the options
                Array.from(target.querySelectorAll('option')).forEach(function(option) {
                    if (option.children.length > 0) {
                        Array.from(option.children).forEach(function(childOption) {
                            if (childOption.selected) {
                                selectedOptions.push(childOption.value.toString());
                            }
                        });
                    }
                    else {
                        if (option.selected) {
                            selectedOptions.push(option.value.toString());
                        }
                    }
                });

                // Find and update the corresponding virtual options
                if (target.closest('div.iweby-select').querySelectorAll('div.virtual > div.options ul > li > a').length > 0) {
                    target.closest('div.iweby-select').querySelectorAll('div.virtual > div.options ul > li > a').forEach(function(anchor) {
                        const optionValue = anchor.getAttribute('data-value');
                        if (thisInstance.isValue(optionValue)) {
                            if (!thisInstance.isMatch(selectedOptions.indexOf(optionValue), -1)) {
                                anchor.parentElement.classList.add('node-selected');
                                if (thisInstance.isValue(selectedOptionLabel)) {
                                    selectedOptionLabel += ', ';
                                }
                                selectedOptionLabel += anchor.textContent;
                            }
                            else {
                                anchor.parentElement.classList.remove('node-selected');
                            }
                        }
                    });

                    // Set the default option label if none selected
                    if (!thisInstance.isValue(selectedOptionLabel)) {
                        selectedOptionLabel = ((thisInstance.isValue(target.getAttribute('data-default'))) ? target.getAttribute('data-default') : thisInstance.language[thisInstance.currentLangCode]['pleaseSelect']);
                    }

                    // Update the virtual result label
                    target.closest('div.iweby-select').querySelector('div.virtual > a.result').innerHTML = selectedOptionLabel;
                }
            } 
            
            // File input preview
            else if (target.closest('div.iweby-input-file') && !target.closest('div.iweby-files-dropzone')) {
                const filePreviewArea = target.closest('div.iweby-input-file').querySelector('div.preview');
                if(filePreviewArea) {
                    filePreviewArea.remove();
                }
                if(target.files.length > 0) {
                    let selectedFiles = Array.from(target.files);
                    const previewArea = document.createElement('div');
                    previewArea.classList.add('preview');
                    selectedFiles.forEach(function(file, i) {
                        const blockdiv = document.createElement('div');
                        const span = document.createElement('span');
                        span.innerHTML = file.name;
        
                        const deleteBtn = document.createElement('a');
                        deleteBtn.setAttribute('data-index', i);
                        deleteBtn.innerHTML = '<i class="fa fa-times" aria-hidden="true"></i>';
                        
                        deleteBtn.addEventListener('click', function(e){
                            const btnTarget = e.target;
                            const inputTarget = btnTarget.closest('div.iweby-input-file').querySelector('input[type="file"]');

                            selectedFiles.splice(target.getAttribute('data-index'), 1);
                            btnTarget.closest('div').remove();
                            
                            const newInput = inputTarget.cloneNode(false);
                            const dt = new DataTransfer();
                            selectedFiles.forEach(file => dt.items.add(file));
                            newInput.files = dt.files;

                            inputTarget.parentNode.replaceChild(newInput, inputTarget);
                        });
                        
                        blockdiv.appendChild(span);
                        blockdiv.appendChild(deleteBtn);
                        previewArea.appendChild(blockdiv);
                    });
                    
                    target.closest('div.iweby-input-file').appendChild(previewArea);
                }
            }
            
            // Checkbox synchronization
            else if (target.closest('div.iweby-checkbox')) {
                const relatedObject = document.querySelectorAll('input[type="checkbox"][name="' + (target.name) + '"]');
                relatedObject.forEach(function(relatedCheckbox) {
                    relatedCheckbox.closest('div.iweby-checkbox').classList.remove('checked');
                    if (relatedCheckbox.checked) {
                        relatedCheckbox.closest('div.iweby-checkbox').classList.add('checked');
                    }
                    relatedCheckbox.closest('div.iweby-checkbox').classList.remove('error');
                });

                // Remove tips
                if (target.closest('div.iweby-checkbox-set')) {
                    const oriSmallTips = target.closest('div.iweby-checkbox-set').querySelector('small.tips');
                    if(oriSmallTips) {
                        oriSmallTips.remove();
                    }
                }
            } 
            
            // Radio synchronization
            else if (target.closest('div.iweby-radio')) {
                const selectedValue = target.value;
                const relatedObject = document.querySelectorAll('input[type="radio"][name="' + (target.name) + '"]');
                relatedObject.forEach(function(relatedRadio) {
                    if (thisInstance.isMatch(relatedRadio.value, selectedValue)) {
                        relatedRadio.checked = true;
                        relatedRadio.closest('div.iweby-radio').classList.add('checked');
                    }
                    else {
                        relatedRadio.checked = false;
                        relatedRadio.closest('div.iweby-radio').classList.remove('checked');
                    }
                    relatedRadio.closest('div.iweby-radio').classList.remove('error');
                });

                // Remove tips
                if (target.closest('div.iweby-radio-set')) {
                    const oriSmallTips = target.closest('div.iweby-radio-set').querySelector('small.tips');
                    if(oriSmallTips) {
                        oriSmallTips.remove();
                    }
                }
            }
        });

        // --- Font Size Initialization ---
        const fontSizeClasses = ['small-font', 'middle-font', 'large-font'];
        const defaultFontSize = (thisInstance.getCookie('iweb_font_size'));
        const fontButtons = document.querySelectorAll('a.font-switch');
        if (thisInstance.isValue(defaultFontSize)) {
            document.documentElement.classList.remove(...fontSizeClasses);
            document.documentElement.classList.add(defaultFontSize + '-font');
            fontButtons.forEach(function(btn) {
                btn.classList.toggle('current', thisInstance.isMatch(btn.getAttribute('data-size'), defaultFontSize));
            });
        }
    }

    /**
     * Initializes all UI components: inputs, selects, checkboxes, radios, iframes, videos, tables, forms
     */
    initComponent() {
        const thisInstance = this;
        
        // Beautify components
        thisInstance.inputBox();
        thisInstance.selectBox();
        thisInstance.checkBox();
        thisInstance.radioBox();
        setTimeout(function() {
            thisInstance.iframe();
            thisInstance.video();
            thisInstance.responsive();
        }, 500);
        
        // Set flex gap
        const uls = document.querySelectorAll('ul.iweby-flex');
        if(uls.length > 0) {
            uls.forEach(ul => {
                const gap = ul.dataset.gap;
                if (thisInstance.isNumber(gap)) {
                    if (!ul.classList.contains('inited')) {
                        ul.style.gap = Math.max(0, parseInt(gap, 0)) + 'px';
                        ul.removeAttribute('data-gap');
                        ul.classList.add('inited');
                    }
                }
            });
        }

        // Insert clear div before & after into editor div
        const editors = document.querySelectorAll('div.iweby-editor');
        if(editors.length > 0) {
            editors.forEach(editor => {
                if (!editor.classList.contains('inited')) {
                    const clearBefore = document.createElement('div');
                    clearBefore.className = 'clearboth';
                    editor.insertAdjacentElement('afterbegin', clearBefore);

                    const clearAfter = document.createElement('div');
                    clearAfter.className = 'clearboth';
                    editor.insertAdjacentElement('beforeend', clearAfter);

                    editor.classList.add('inited');
                }
            });
        }
        
        // Initialize responsive table
        const rtable = document.querySelectorAll('table.iweby-table');
        if(rtable.length > 0) {
            rtable.forEach(function(table) {
                table.querySelectorAll('th, td').forEach(cell => {
                    const wrapper = document.createElement('div');
                    while (cell.firstChild) {
                      wrapper.appendChild(cell.firstChild);
                    }
                    cell.appendChild(wrapper);
                });
            });
        }
        
        // Initialize forms
        thisInstance.initForm();
    }

    /**
     * Beautifies input elements and initializes date/time pickers
     * @param {NodeList|string} inputObject - Input elements or selector
     * @param {Function} callBack - Callback function after initialization
     */
    inputBox(inputObject, callBack) {
        const thisInstance = this;

        // Default to selecting all relevant elements if none provided
        if (!thisInstance.isValue(inputObject)) {
            const defaultInput = [
                'input[type="text"]',
                'input[type="password"]',
                'input[type="datetime-local"]',
                'input[type="date"]',
                'input[type="time"]',
                'input[type="color"]',
                'input[type="tel"]',
                'input[type="email"]',
                'input[type="number"]',
                'input[type="file"]',
                'textarea'
            ];
            inputObject = document.querySelectorAll(defaultInput.join(', '));
        }

        if (inputObject.length > 0) {
            inputObject.forEach(function(input) {
                if (!input.closest('div.iweby-input')) {
                    // Create div and move the input into it
                    const inputType = input.type;
                    const isAutocomplete = (thisInstance.isMatch(input.getAttribute('data-autocomplete'), 1) || thisInstance.isMatch(input.getAttribute('data-autocomplete'), true));
                    const wrapperDiv = document.createElement('div');
                    wrapperDiv.classList.add('iweby-input');
                    wrapperDiv.classList.add((isAutocomplete ? 'iweby-input-autocomplete' : 'iweby-input-' + (thisInstance.isValue(input.type) ? input.type : 'text')));
                    input.parentNode.insertBefore(wrapperDiv, input);
                    wrapperDiv.appendChild(input);

                    // Add additional elements to the input
                    if (!isAutocomplete) {
                        if (thisInstance.isMatch(inputType, 'password')) {
                            // Create password switch type button
                            const BtnSwitchType = document.createElement('button');
                            BtnSwitchType.type = 'button';
                            BtnSwitchType.classList.add('switch-pwd-type');

                            const eyeSlashIcon = document.createElement('i');
                            eyeSlashIcon.classList.add('fa', 'fa-eye-slash', 'hide');
                            eyeSlashIcon.style.display = 'block';
                            const eyeIcon = document.createElement('i');
                            eyeIcon.classList.add('fa', 'fa-eye', 'show');
                            eyeIcon.style.display = 'none';

                            // Append elements
                            BtnSwitchType.appendChild(eyeSlashIcon);
                            BtnSwitchType.appendChild(eyeIcon);
                            wrapperDiv.appendChild(BtnSwitchType);
                        }
                        else if (thisInstance.isMatch(inputType, 'color')) {
                            // Set color input
                            input.style.position = 'relative';
                            input.style.zIndex = 1;

                            // Create color code input
                            const inputColorCode = document.createElement('input');
                            inputColorCode.type = 'text';
                            inputColorCode.maxLength = 7;
                            inputColorCode.value = input.value;
                            inputColorCode.style.position = 'absolute';
                            inputColorCode.style.top = '0px';
                            inputColorCode.style.left = '0px';
                            inputColorCode.style.right = '0px';
                            inputColorCode.style.bottom = '0px';
                            inputColorCode.style.paddingLeft = '42px';

                            // Append elements
                            wrapperDiv.appendChild(inputColorCode);
                        }
                    }
                    else {
                        // Create search input
                        const validationArray = (thisInstance.isValue(input.getAttribute('data-validation'))?(input.getAttribute('data-validation').toString().split('|')):[]);
                        const canNew = (thisInstance.isMatch(input.getAttribute('data-cannew'), 1)) ? true : false;

                        const fillText = document.createElement('input');
                        fillText.type = 'text';
                        if (canNew) {
                            fillText.name = input.name.toString().replace(/(\w+)(\[\])?$/, '$1_txt$2');
                            if ((validationArray.includes('required'))) {
                                fillText.setAttribute('data-validation', 'required');
                            }
                        }

                        fillText.placeholder = (input.getAttribute('data-placeHolder') || '');
                        fillText.classList.add('fill-text');
                        fillText.style.display = 'block';
                        fillText.style.width = '100%';
                        fillText.autocomplete = 'off';
                        
                        wrapperDiv.appendChild(fillText);

                        // Create reset button
                        const defaultText = input.getAttribute('data-default');
                        input.removeAttribute('data-default');
                        if (thisInstance.isValue(defaultText)) {
                            fillText.setAttribute('data-value', input.value);
                            fillText.setAttribute('data-default', defaultText);
                            fillText.setAttribute('value', defaultText);
                            fillText.readOnly = true;

                            const fillReset = document.createElement('a');
                            fillReset.classList.add('fill-reset');

                            // Create Reset icon
                            const fillResetIcon = document.createElement('i');
                            fillResetIcon.classList.add('fa', 'fa-times');

                            // Append elements
                            fillReset.appendChild(fillResetIcon);
                            wrapperDiv.appendChild(fillReset);
                        }

                        // Hide input
                        input.type = 'hidden';
                        input.classList.add('fill-id');
                        input.removeAttribute('data-validation');
                        input.removeAttribute('data-cannew');
                        input.removeAttribute('data-autocomplete');
                    }

                    // Set input styles
                    input.style.display = (thisInstance.isMatch(inputType, 'color') ? 'inline-block' : 'block');
                    input.style.width = (thisInstance.isMatch(inputType, 'color') ? '36px' : '100%');
                    input.autocomplete = 'off';
                }
            });
        }

        // Initialize date picker
        if (!thisInstance.isValue(thisInstance.datePicker)) {
            thisInstance.datePicker = new iDatePicker(thisInstance.currentLangCode);
        }
        thisInstance.datePicker.render('input[type="date"]');

        // Initialize time picker
        if (!thisInstance.isValue(thisInstance.timePicker)) {
            thisInstance.timePicker = new iTimePicker();
        }
        thisInstance.timePicker.render('input[type="time"]');

        // Callback
        if ((typeof callBack) === 'function') {
            callBack();
        }
    }

    /**
     * Beautifies select elements with virtual dropdown
     * @param {NodeList|string} selectObject - Select elements or selector
     * @param {Function} callBack - Callback function after initialization
     */
    selectBox(selectObject, callBack) {
        const thisInstance = this;

        // Default to selecting all relevant elements if none provided
        if (!thisInstance.isValue(selectObject)) {
            selectObject = document.querySelectorAll('select');
        }

        if (selectObject.length > 0) {
            selectObject.forEach(function(select, selectIndex) {
                if (!select.closest('div.iweby-select')) {
                    // Get config
                    const isMultiple = ((thisInstance.isMatch(select.multiple, 1) || thisInstance.isMatch(select.multiple, true)) ? true : false);
                    const isVirtual = ((thisInstance.isMatch(select.getAttribute('data-virtual'), 1) || thisInstance.isMatch(select.getAttribute('data-virtual'), true)) ? true : false);
                    const isFilter = ((thisInstance.isMatch(select.getAttribute('data-filter'), 1) || thisInstance.isMatch(select.getAttribute('data-filter'), true)) ? true : false);
                    const isPositionTop = ((thisInstance.isMatch(select.getAttribute('data-top'), 1) || thisInstance.isMatch(select.getAttribute('data-top'), true)) ? true : false);

                    if (isVirtual) {
                        // Create div & move the select into div
                        const wrapperDiv = document.createElement('div');
                        wrapperDiv.classList.add('iweby-select');
                        if (isMultiple) {
                            wrapperDiv.classList.add('iweby-select-multiple');
                        };

                        const realDiv = document.createElement('div');
                        realDiv.classList.add('real', 'hidden');

                        select.parentNode.insertBefore(realDiv, select);
                        realDiv.appendChild(select);

                        realDiv.parentNode.insertBefore(wrapperDiv, realDiv);
                        wrapperDiv.appendChild(realDiv);

                        // Create a virtual div & move the result section into div
                        let virtualSelect = '';
                        const virtualDiv = document.createElement('div');
                        virtualDiv.classList.add('virtual');

                        const resultLink = document.createElement('a');
                        resultLink.classList.add('result');
                        resultLink.textContent = virtualSelect;
                        virtualDiv.appendChild(resultLink);

                        // Create options list
                        const optionsDiv = document.createElement('div');
                        optionsDiv.classList.add('options');
                        if (isPositionTop) {
                            optionsDiv.classList.add('top');
                        }
                        const optionsList = document.createElement('ul');
                        optionsList.setAttribute('data-index', 'iss' + selectIndex);

                        // Create filter input
                        if (isFilter) {
                            const filterLi = document.createElement('li');
                            filterLi.classList.add('filter');

                            const placeHolderText = (select.getAttribute('data-placeHolder') || '');
                            const filterInput = document.createElement('input');
                            filterInput.id = 'fkw_' + selectIndex;
                            filterInput.type = 'text';
                            filterInput.placeholder = placeHolderText.trim();

                            // Append elements
                            filterLi.appendChild(filterInput);
                            optionsList.appendChild(filterLi);
                        }

                        // Loop through options and create the list
                        if (select.children.length > 0) {
                            Array.from(select.children).forEach(function(optionGroup) {
                                if (optionGroup.children.length > 0) {
                                    const parentLi = document.createElement('li');
                                    parentLi.classList.add('node', 'node-parent');

                                    const parentLink = document.createElement('a');
                                    parentLink.textContent = optionGroup.getAttribute('label');
                                    parentLi.appendChild(parentLink);

                                    const childUl = document.createElement('ul');
                                    Array.from(optionGroup.children).forEach(function(option) {
                                        if (thisInstance.isValue(option.value)) {
                                            const childLi = document.createElement('li');
                                            childLi.classList.add('node');
                                            if (option.selected) {
                                                childLi.classList.add('node-selected');
                                                childLi.setAttribute('data-ori', 'selected');
                                                virtualSelect += (virtualSelect ? ', ' : '');
                                                virtualSelect += option.textContent;
                                            }

                                            const childLink = document.createElement('a');
                                            childLink.setAttribute('data-value', option.value);
                                            childLink.textContent = option.textContent;

                                            // Append elements
                                            childLi.appendChild(childLink);
                                            childUl.appendChild(childLi);
                                        }
                                    });

                                    // Append elements
                                    parentLi.appendChild(childUl);
                                    optionsList.appendChild(parentLi);
                                }
                                else {
                                    const singleLi = document.createElement('li');
                                    singleLi.classList.add('node');
                                    const singleLink = document.createElement('a');
                                    singleLink.setAttribute('data-value', optionGroup.value);
                                    singleLink.textContent = optionGroup.textContent;
                                    if (optionGroup.selected) {
                                        singleLi.classList.add('node-selected');
                                        singleLi.setAttribute('data-ori', 'selected');
                                        virtualSelect += (virtualSelect ? ', ' : '');
                                        virtualSelect += optionGroup.textContent;
                                    }

                                    // Append elements
                                    singleLi.appendChild(singleLink);
                                    optionsList.appendChild(singleLi);
                                }
                            });
                        }

                        // Set the default select text if nothing is selected
                        if (!thisInstance.isValue(virtualSelect)) {
                            virtualSelect = (thisInstance.isValue(select.getAttribute('data-default')) ? select.getAttribute('data-default') : thisInstance.language[thisInstance.currentLangCode]['pleaseSelect']);
                        }
                        resultLink.textContent = virtualSelect;

                        // Append elements
                        optionsDiv.appendChild(optionsList);
                        virtualDiv.appendChild(optionsDiv);
                        wrapperDiv.appendChild(virtualDiv);
                    }
                    else {
                        // Create div & move the select into the div
                        const wrapperDiv = document.createElement('div');
                        wrapperDiv.classList.add('iweby-select');
                        const realDiv = document.createElement('div');
                        realDiv.classList.add('real');

                        select.parentNode.insertBefore(realDiv, select);
                        realDiv.appendChild(select);

                        realDiv.parentNode.insertBefore(wrapperDiv, realDiv);
                        wrapperDiv.appendChild(realDiv);
                    }

                    // Remove select Attribute
                    select.removeAttribute('data-virtual');
                    select.removeAttribute('data-filter');
                }
            });
        }

        // Callback
        if ((typeof callBack) === 'function') {
            callBack();
        }
    }

    /**
     * Beautifies checkbox elements
     * @param {NodeList|string} checkboxObject - Checkbox elements or selector
     * @param {Function} callBack - Callback function after initialization
     */
    checkBox(checkboxObject, callBack) {
        const thisInstance = this;

        // Default to selecting all relevant elements if none provided
        if (!thisInstance.isValue(checkboxObject)) {
            checkboxObject = document.querySelectorAll('input[type="checkbox"]');
        }

        if (checkboxObject.length > 0) {
            checkboxObject.forEach(function(checkbox) {
                if (!checkbox.closest('div.iweby-checkbox')) {
                    const findCheckboxLabel = checkbox.nextElementSibling;

                    // Create div
                    const wrapperDiv = document.createElement('div');
                    wrapperDiv.classList.add('iweby-checkbox');
                    if (checkbox.checked) {
                        wrapperDiv.classList.add('checked');
                    }

                    // Move the checkbox into div and then append label next to it
                    checkbox.parentNode.insertBefore(wrapperDiv, checkbox);
                    wrapperDiv.appendChild(checkbox);
                    if (findCheckboxLabel && thisInstance.isMatch(findCheckboxLabel.tagName, 'label')) {
                        findCheckboxLabel.parentNode.insertBefore(wrapperDiv, findCheckboxLabel);
                        wrapperDiv.appendChild(findCheckboxLabel);
                    }
                }
            });
        }

        // Callback
        if ((typeof callBack) === 'function') {
            callBack();
        }
    }
    
    /**
     * Sets checkbox checked state programmatically
     * @param {Element|NodeList} checkboxObject - Checkbox element(s)
     * @param {boolean} isChecked - Whether to check or uncheck
     * @param {Function} callBack - Callback function
     */
    setCheckBox(checkboxObject, isChecked = false, callBack) {
        const thisInstance = this;
        
        if (thisInstance.isValue(checkboxObject)) {
            if (checkboxObject instanceof Element) {
                checkboxObject.checked = isChecked;
                if(checkboxObject.checked) {
                    checkboxObject.parentElement.classList.add('checked');
                }
                else {
                    checkboxObject.parentElement.classList.remove('checked');
                }
            }
            else if (checkboxObject instanceof NodeList) {
                checkboxObject.forEach(checkbox => {
                    checkbox.checked = isChecked;
                    if(checkbox.checked) {
                        checkbox.parentElement.classList.add('checked');
                    }
                    else {
                        checkbox.parentElement.classList.remove('checked');
                    }
                });
            }
        }
        
        // Callback
        if ((typeof callBack) === 'function') {
            callBack();
        }
    }

    /**
     * Beautifies radio button elements
     * @param {NodeList|string} radioObject - Radio elements or selector
     * @param {Function} callBack - Callback function after initialization
     */
    radioBox(radioObject, callBack) {
        const thisInstance = this;

        // Default to selecting all relevant elements if none provided
        if (!thisInstance.isValue(radioObject)) {
            radioObject = document.querySelectorAll('input[type="radio"]');
        }

        if (radioObject.length > 0) {
            radioObject.forEach(function(radio) {
                if (!radio.closest('div.iweby-radio')) {
                    const findRadioLabel = radio.nextElementSibling;

                    // Create div
                    const wrapperDiv = document.createElement('div');
                    wrapperDiv.classList.add('iweby-radio');
                    if (radio.checked) {
                        wrapperDiv.classList.add('checked');
                    }

                    // Move the radio into div and then append label next to it
                    radio.parentNode.insertBefore(wrapperDiv, radio);
                    wrapperDiv.appendChild(radio);
                    if (findRadioLabel && thisInstance.isMatch(findRadioLabel.tagName, 'label')) {
                        findRadioLabel.parentNode.insertBefore(wrapperDiv, findRadioLabel);
                        wrapperDiv.appendChild(findRadioLabel);
                    }
                }
            });
        }

        // Callback
        if ((typeof callBack) === 'function') {
            callBack();
        }
    }
    
    /**
     * Sets radio button checked state programmatically
     * @param {Element|NodeList} radioObject - Radio element(s)
     * @param {boolean} isChecked - Whether to check or uncheck
     * @param {Function} callBack - Callback function
     */
    setRadioBox(radioObject, isChecked = false, callBack) {
        const thisInstance = this;
        
        if (thisInstance.isValue(radioObject)) {
            if (radioObject instanceof Element) {
                radioObject.checked = isChecked;
                if(radioObject.checked) {
                    radioObject.parentElement.classList.add('checked');
                }
                else {
                    radioObject.parentElement.classList.remove('checked');
                }
            }
            else if (radioObject instanceof NodeList) {
                radioObject.forEach(radio => {
                    radio.checked = isChecked;
                    if(radio.checked) {
                        radio.parentElement.classList.add('checked');
                    }
                    else {
                        radio.parentElement.classList.remove('checked');
                    }
                });
            }
        }
        
        // Callback
        if ((typeof callBack) === 'function') {
            callBack();
        }
    }
    
    /**
     * Adds required field indicators (*) to labels
     */
    setLabelDot() {
        document.querySelectorAll('input[data-validation], select[data-validation], textarea[data-validation]').forEach(input => {
            const validation = input.getAttribute('data-validation');
            let id = (input.id || input.name);
            if (id) {
                if(input.classList.contains('fill-text')) {
                   id = id.replace(/_txt$/, '');
                }
                const label = document.querySelector(`label[for="${id}"]`);
                if (validation.includes('required')) {
                    if (label && !label.innerHTML.includes('*')) {
                        label.innerHTML += ' <small class="required-red-dot">*</small>';
                    }
                }
                else {
                    if (label && label.innerHTML.includes('*')) {
                        const starRegex = /\s*<small class="required-reddot">\*<\/small>/;
                        label.innerHTML = label.innerHTML.replace(starRegex, '').trim();
                    }
                }
            }
        });
    }
    
    /**
     * Makes iframes, videos, objects, and embeds responsive
     * @param {string} element - Parent element selector
     * @param {Function} callBack - Callback function
     */
    iframe(element = 'div.iweby-editor', callBack) {
        const thisInstance = this;

        if (thisInstance.isValue(element)) {
            // Get all specified tags within the given element
            let elements = null;
            ['iframe', 'video', 'object', 'embed'].forEach(function(value) {
                elements = document.querySelectorAll(element + ' ' + value);
                elements.forEach(function(e) {
                    // Check if the parent does not have the class 'iweby-responsive'
                    if (!e.closest('div.iweby-responsive')) {
                        // Wrap the element in a div with 'iweby-responsive' class
                        const wrapper = document.createElement('div');
                        wrapper.className = 'iweby-responsive';
                        wrapper.setAttribute('data-width', e.offsetWidth);
                        wrapper.setAttribute('data-height', e.offsetHeight);

                        e.classList.add('vframe');
                        e.parentNode.insertBefore(wrapper, e);
                        wrapper.appendChild(e);
                    }
                });
            });
            
            if ((typeof callBack) === 'function') {
                callBack();
            }
        }
    }
    
    /**
     * Creates custom video player with controls
     * @param {Function} callBack - Callback function
     */
    video(callBack) {
        const thisInstance = this;
        
        const elements = document.querySelectorAll('video.iweby-video');
        elements.forEach(async function(e) {
            if (!e.closest('div.iweby-video')) {
                e.removeAttribute('controls');
                
                const included_rdiv = (thisInstance.isValue(e.closest('div.iweby-responsive')));
                const wrapper = document.createElement('div');
                wrapper.className = 'iweby-video iweby-responsive';
                wrapper.setAttribute('data-width', (e.getAttribute('width') || e.offsetWidth));
                wrapper.setAttribute('data-height', (e.getAttribute('height') || e.offsetHeight));

                if (!thisInstance.isValue(e.querySelector('source').getAttribute('src')) && thisInstance.isValue(e.getAttribute('data-source'))) {
                    try {
                        const response = await fetch(e.getAttribute('data-source'));
                        const blob = await response.blob();
                        const blobUrl = URL.createObjectURL(blob);
                        e.querySelector('source').src = blobUrl;
                        e.load();
                        e.addEventListener('canplay', (v) => {
                            setTimeout(function() {
                                const width = (e.getAttribute('width') || e.offsetWidth);
                                const height = (e.getAttribute('height') || e.offsetHeight);
                                if(width <= 0 || height <= 0) {
                                    width = 300;
                                    height = 250;
                                }
                                v.target.closest('div.iweby-video').setAttribute('data-width', width);
                                v.target.closest('div.iweby-video').setAttribute('data-height', height);
                                thisInstance.responsive();
                            }, 500);
                        });
                    } catch (err) {
                        console.log('Failed to load video from ' + e.getAttribute('data-source'), err);
                    }
                }
                e.removeAttribute('data-source');
                e.removeAttribute('class');
                e.addEventListener('contextmenu', function(v) {
                    v.preventDefault();
                });
                e.addEventListener('loadedmetadata', (v) => {
                    v.target.closest('div.iweby-video').querySelector('span.v-duration').textContent = thisInstance.formatTime(0) + ' / ' + thisInstance.formatTime(e.duration);
                });
                e.addEventListener('timeupdate', (v) => {
                    if(e.duration > 0) {
                        v.target.closest('div.iweby-video').querySelector('span.v-duration').textContent = thisInstance.formatTime(e.currentTime) + ' / ' + thisInstance.formatTime(e.duration);
                        v.target.closest('div.iweby-video').querySelector('input.v-progress-bar').value = (e.currentTime / e.duration) * 100;
                        if(parseInt(e.currentTime) >= parseInt(e.duration)) {
                            v.target.closest('div.iweby-video').querySelector('button.v-play-btn').innerHTML = '<svg viewBox="0 0 20 20" fill="#ffffff" stroke="#ffffff"><path d="M2.067,0.043C2.21-0.028,2.372-0.008,2.493,0.085l13.312,8.503c0.094,0.078,0.154,0.191,0.154,0.313 c0,0.12-0.061,0.237-0.154,0.314L2.492,17.717c-0.07,0.057-0.162,0.087-0.25,0.087l-0.176-0.04 c-0.136-0.065-0.222-0.207-0.222-0.361V0.402C1.844,0.25,1.93,0.107,2.067,0.043z"></path></svg>';
                        }
                    }
                });

                if (!included_rdiv) {
                    e.parentNode.insertBefore(wrapper, e);
                    wrapper.appendChild(e);
                }
                else {
                    e.closest('div.iweby-responsive').classList.add('iweby-video');
                } 

                const controls = document.createElement('div');
                controls.className = 'controls';

                // Play Button
                const playDiv = document.createElement('div');
                const playBtn = document.createElement('button');
                playBtn.className = 'v-play-btn';
                playBtn.innerHTML = '<svg viewBox="0 0 20 20" fill="#ffffff" stroke="#ffffff"><path d="M2.067,0.043C2.21-0.028,2.372-0.008,2.493,0.085l13.312,8.503c0.094,0.078,0.154,0.191,0.154,0.313 c0,0.12-0.061,0.237-0.154,0.314L2.492,17.717c-0.07,0.057-0.162,0.087-0.25,0.087l-0.176-0.04 c-0.136-0.065-0.222-0.207-0.222-0.361V0.402C1.844,0.25,1.93,0.107,2.067,0.043z"></path></svg>';
                playBtn.addEventListener('click', function(e) {
                    const target = e.target;
                    target.closest('div.iweby-video').querySelector('div.volume').classList.remove('show');
                    const video = target.closest('div.iweby-video').querySelector('video');
                    if (video.paused) {
                        video.play();
                        target.closest('div.iweby-video').querySelector('button.v-play-btn').innerHTML = '<svg viewBox="0 0 26 24" fill="#ffffff" stroke="#ffffff"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.163 3.819C5 4.139 5 4.559 5 5.4v13.2c0 .84 0 1.26.163 1.581a1.5 1.5 0 0 0 .656.655c.32.164.74.164 1.581.164h.2c.84 0 1.26 0 1.581-.163a1.5 1.5 0 0 0 .656-.656c.163-.32.163-.74.163-1.581V5.4c0-.84 0-1.26-.163-1.581a1.5 1.5 0 0 0-.656-.656C8.861 3 8.441 3 7.6 3h-.2c-.84 0-1.26 0-1.581.163a1.5 1.5 0 0 0-.656.656zm9 0C14 4.139 14 4.559 14 5.4v13.2c0 .84 0 1.26.164 1.581a1.5 1.5 0 0 0 .655.655c.32.164.74.164 1.581.164h.2c.84 0 1.26 0 1.581-.163a1.5 1.5 0 0 0 .655-.656c.164-.32.164-.74.164-1.581V5.4c0-.84 0-1.26-.163-1.581a1.5 1.5 0 0 0-.656-.656C17.861 3 17.441 3 16.6 3h-.2c-.84 0-1.26 0-1.581.163a1.5 1.5 0 0 0-.655.656z" fill="#ffffff"></path></svg>';
                    }
                    else {
                        video.pause();
                        target.closest('div.iweby-video').querySelector('button.v-play-btn').innerHTML = '<svg viewBox="0 0 20 20" fill="#ffffff" stroke="#ffffff"><path d="M2.067,0.043C2.21-0.028,2.372-0.008,2.493,0.085l13.312,8.503c0.094,0.078,0.154,0.191,0.154,0.313 c0,0.12-0.061,0.237-0.154,0.314L2.492,17.717c-0.07,0.057-0.162,0.087-0.25,0.087l-0.176-0.04 c-0.136-0.065-0.222-0.207-0.222-0.361V0.402C1.844,0.25,1.93,0.107,2.067,0.043z"></path></svg>';
                    }
                });
                playDiv.appendChild(playBtn);

                // Duration
                const durationDiv = document.createElement('div');
                const durationSpan = document.createElement('span');
                durationSpan.className = 'v-duration';
                durationSpan.textContent = '00:00 / 00:00';
                durationDiv.appendChild(durationSpan);

                // Volume
                const soundDiv = document.createElement('div');
                const soundBtn = document.createElement('button');
                soundBtn.className = 'v-sound-btn';
                soundBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#ffffff"><path d="M3 11V13M6 8V16M9 10V14M12 7V17M15 4V20M18 9V15M21 11V13" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
                soundBtn.addEventListener('click', function(e) {
                    const target = e.target;
                    if (target.closest('div').querySelector('div.volume').classList.contains('show')) {
                        target.closest('div').querySelector('div.volume').classList.remove('show');
                    }
                    else {
                        target.closest('div').querySelector('div.volume').classList.add('show');
                    }
                });

                const volumeDiv = document.createElement('div');
                volumeDiv.className = 'volume';
                const volumeRange = document.createElement('input');
                volumeRange.type = 'range';
                volumeRange.className = 'v-volume-bar';
                volumeRange.min = '0';
                volumeRange.max = '1';
                volumeRange.step = '0.01';
                volumeRange.value = '1';
                volumeRange.addEventListener('input', function(e) {
                    const target = e.target;
                    const video = target.closest('div.iweby-video').querySelector('video');
                    video.volume = e.target.value;
                });
                volumeDiv.appendChild(volumeRange);
                soundDiv.appendChild(soundBtn);
                soundDiv.appendChild(volumeDiv);

                // Fullscreen
                const fullscreenDiv = document.createElement('div');
                const fullscreenBtn = document.createElement('button');
                fullscreenBtn.className = 'v-fullscreen-btn';
                fullscreenBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#ffffff"><path d="M21 9V8C21 5.79086 18.9853 4 16.5 4H15.25M21 15V16C21 18.2091 18.9853 20 16.5 20H15.25M3 15V16C3 18.2091 5.01472 20 7.5 20H8.75M3 9V8C3 5.79086 5.01472 4 7.5 4H8.75" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
                fullscreenBtn.addEventListener('click', function(e) {
                    const target = e.target;
                    const target_video = target.closest('div.iweby-video').querySelector('video'); 
                    if (target_video.requestFullscreen) {
                        target_video.requestFullscreen();
                    } else if (target_video.mozRequestFullScreen) {
                        target_video.mozRequestFullScreen();
                    } else if (target_video.webkitRequestFullscreen) {
                        target_video.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
                    } else if (target_video.msRequestFullscreen) {
                        target_video.msRequestFullscreen();
                    }
                    target.closest('div.iweby-video').querySelector('div.volume').classList.remove('show');
                });
                fullscreenDiv.appendChild(fullscreenBtn);

                // Progress bar
                const progressDiv = document.createElement('div');
                const progressRange = document.createElement('input');
                progressRange.type = 'range';
                progressRange.className = 'v-progress-bar';
                progressRange.min = '0';
                progressRange.max = '100';
                progressRange.value = '0';
                progressRange.addEventListener('input', function(e) {
                    const target = e.target;
                    const video = target.closest('div.iweby-video').querySelector('video');
                    video.currentTime = parseFloat((e.target.value / 100) * video.duration);
                    target.closest('div.iweby-video').querySelector('div.volume').classList.remove('show');
                });

                progressDiv.appendChild(progressRange);

                // Append all
                controls.appendChild(playDiv);
                controls.appendChild(durationDiv);
                controls.appendChild(soundDiv);
                controls.appendChild(fullscreenDiv);
                controls.appendChild(progressDiv);

                if (!included_rdiv) {
                    wrapper.appendChild(controls);
                }
                else {
                    e.closest('div.iweby-responsive').appendChild(controls);
                }
            }
        });
        
        if ((typeof callBack) === 'function') {
            callBack();
        }
    }

    /**
     * Makes elements responsive by maintaining aspect ratio
     */
    responsive() {
        const thisInstance = this;
        const responsiveElements = document.querySelectorAll('div.iweby-responsive');
        if (responsiveElements.length > 0) {
            responsiveElements.forEach(function(e) {
                let currentWidth = e.clientWidth;
                let newHeight = 0;
                let defineRatioWidth = e.getAttribute('data-width');
                let defineRatioHeight = e.getAttribute('data-height');

                if (thisInstance.isValue(defineRatioWidth) && thisInstance.isValue(defineRatioHeight)) {
                    if (defineRatioHeight > 0 && defineRatioWidth > 0) {
                        newHeight = parseInt((currentWidth * defineRatioHeight) / defineRatioWidth);
                    }
                }

                if (newHeight > 0) {
                    e.style.height = newHeight + 'px';
                }
                else {
                    e.style.height = 'auto';
                }
            });
        }
    }
    
    /**
     * Makes tables responsive with vertical labels on small screens
     */
    responsiveTable() {
        const thisInstance = this;
        const rtable = document.querySelectorAll('table.iweby-table');
        if(rtable.length > 0) {
            rtable.forEach(function(table) {
                const switch_width = (table.dataset.rw || 600);
                const headerTxts = Array.from(table.querySelectorAll('thead th'), th => th.textContent.trim());
                if(switch_width >= thisInstance.viewerWidth) {
                    let headerBackground = [];
                    let headerBackgrounds = [];
                    if(headerTxts.length > 0 ) {
                        headerBackground = window.getComputedStyle(table.querySelector('thead tr')).backgroundColor;
                        headerBackgrounds = Array.from(table.querySelectorAll('thead th'), th => window.getComputedStyle(th).backgroundColor);
                        table.classList.add('responsive');
                    }
                    else {
                        table.classList.add('responsive');
                        table.classList.add('non-head');
                    }
                    table.querySelectorAll('tbody tr').forEach(function (tr) {
                        tr.querySelectorAll('td').forEach(function(td, index) {
                            if(!thisInstance.isValue(td.querySelector('div.vlabel'))) {
                                let setBackground = 'rgba(0, 0, 0, 0)';
                                if(headerTxts.length > 0 ) {
                                    setBackground = thisInstance.isMatch((headerBackgrounds[index] || 'rgba(0, 0, 0, 0)'), 'rgba(0, 0, 0, 0)')?headerBackground:(headerBackgrounds[index] || 'rgba(0, 0, 0, 0)');
                                }
                                const wrapper = document.createElement('div');
                                wrapper.classList.add('vlabel');
                                if(headerTxts.length > 0 ) {
                                    wrapper.textContent = (headerTxts[index] || '');
                                }
                                if(!thisInstance.isMatch(setBackground, 'rgba(0, 0, 0, 0)')) {
                                    wrapper.style.background = setBackground;
                                    const rgb = setBackground.match(/\d+/g).map(Number); // [r, g, b, (a)]
                                    const [r, g, b] = rgb;
                                    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                                    if(brightness < 128) {
                                        wrapper.style.color = '#fff';
                                    }
                                }
                                td.insertBefore(wrapper, td.firstChild);
                            }
                        });
                    });
                }
                else {
                    table.classList.remove('responsive');
                    table.classList.remove('non-head');
                    table.querySelectorAll('tbody td').forEach(function(td) {
                        if(thisInstance.isValue(td.querySelector('div.vlabel'))) {
                            td.querySelector('div.vlabel').remove();
                        }
                    });
                }
            });
        }
    }

    /**
     * Initializes pagination on selected elements
     * @param {string} element - Selector for pagination containers
     */
    pagination(element) {
        document.querySelectorAll(element).forEach(function(e) {
            new iPagination(e, {
                mode: (e.getAttribute('data-mode') || 1),
                size: (e.getAttribute('data-size') || 5),
                total: (e.getAttribute('data-totalpage') || 1),
                placeHolder: (e.getAttribute('data-placeHolder') || '')
            });
        });
    }

    /**
     * Alias for doRequest with POST method
     * @param {Object} requestData - Request configuration
     * @param {Function} callBack - Success callback
     * @param {Function} finalCallBack - Final callback
     * @param {Function} progressCallBack - Progress callback
     */
    doPost(requestData, callBack, finalCallBack, progressCallBack) {
        const thisInstance = this;
        thisInstance.doRequest(requestData, callBack, finalCallBack, progressCallBack);
    }
    
    /**
     * Alias for doRequest with GET method
     * @param {Object} requestData - Request configuration
     * @param {Function} callBack - Success callback
     * @param {Function} finalCallBack - Final callback
     * @param {Function} progressCallBack - Progress callback
     */
    doFetch(requestData, callBack, finalCallBack, progressCallBack) {
        const thisInstance = this;
        
        requestData = Object.assign({
            method: 'GET',
            includedToken: false
        }, requestData);
        
        thisInstance.doRequest(requestData, callBack, finalCallBack, progressCallBack);
    }

    /**
     * Core AJAX request handler with progress tracking
     * @param {Object} requestData - Request configuration
     * @param {string} requestData.method - HTTP method (GET, POST)
     * @param {string} requestData.url - Request URL
     * @param {Object} requestData.payload - Request payload data
     * @param {boolean} requestData.includedToken - Whether to include CSRF token
     * @param {string} requestData.dataType - Response data type (json, blob)
     * @param {boolean|number} requestData.showBusy - Show loading indicator
     * @param {boolean} requestData.multiThread - Allow concurrent requests
     * @param {string} requestData.bearerToken - Bearer token for authentication
     * @param {string} requestData.xAuthToken - Custom auth token header
     * @param {Function} callBack - Success callback
     * @param {Function} finalCallBack - Final callback after completion
     * @param {Function} progressCallBack - Upload progress callback
     */
    doRequest(requestData, callBack, finalCallBack, progressCallBack) {
        const thisInstance = this;

        // Merge request data with defaults
        requestData = Object.assign({
            method: 'POST',
            url: '',
            payload: {},
            includedToken: true,
            dataType: 'json',
            showBusy: true,
            multiThread: false,
            bearerToken: '',
            xAuthToken: ''
        }, requestData);
 
        if (requestData.multiThread) {
            thisInstance.isBusy = false;
        }

        let formData = null;
        if (!thisInstance.isBusy && thisInstance.isValue(requestData.url)) {
            const localTime = thisInstance.formatDateTime();
            
            if (requestData.method.toUpperCase() === 'GET') {
                const params = new URLSearchParams();
                
                // Append token
                if(thisInstance.isValue(thisInstance.csrfToken) && thisInstance.isMatch(requestData.includedToken, true)) {
                    params.append('itoken', window.btoa(thisInstance.md5.hash(thisInstance.csrfToken + '#dt' + localTime) + '%' + localTime));
                }
                
                // Append payload
                if (requestData.payload) {
                    for (let key in requestData.payload) {
                        if (requestData.payload.hasOwnProperty(key)) {
                            const value = requestData.payload[key];
                            if (typeof value === 'object') {
                                for (let subKey in value) {
                                    params.append((key + '[' + subKey + ']'), value[subKey]);
                                }
                            } 
                            else {
                                params.append(key, value);
                            }
                        }
                    }
                }
                requestData.url += (requestData.url.includes('?') ? '&' : '?') + params.toString();
            }
            else {
                formData = new FormData();
                
                // Append token
                if(thisInstance.isValue(thisInstance.csrfToken) && thisInstance.isMatch(requestData.includedToken, true)) {
                    formData.append('itoken', window.btoa(thisInstance.md5.hash(thisInstance.csrfToken + '#dt' + localTime) + '%' + localTime));
                }
                
                // Append payload recursively (supports nested objects)
                const appendFormData = (formData, data, parentKey = '') => {
                    if (data && typeof data === 'object' && !(data instanceof File)) {
                        Object.keys(data).forEach(key => {
                            const value = data[key];
                            const fullKey = parentKey ? `${parentKey}[${key}]` : key;
                            appendFormData(formData, value, fullKey);
                        });
                    } else {
                        formData.append(parentKey, data);
                    }
                };
                appendFormData(formData, requestData.payload);
            }

            // Helper function to safely call if the function is defined
            const safeFinalFunc = () => {
                thisInstance.isBusy = false;
                if (!thisInstance.isMatch(requestData.showBusy, 2)) {
                    thisInstance.showBusy(false);
                }

                // Final Callback
                if ((typeof finalCallBack) === 'function') {
                    finalCallBack();
                }
            };

            // Try to send data with progress tracking using XMLHttpRequest
            try {
                thisInstance.isBusy = true;
                thisInstance.showBusy(true, ((thisInstance.isMatch(requestData.showBusy, 1) || thisInstance.isMatch(requestData.showBusy, true)) ? 50 : 0));

                // Use XMLHttpRequest for progress tracking
                const xhr = new XMLHttpRequest();
                xhr.open(requestData.method, requestData.url, true);

                // If the request type is blob, you must tell XHR in advance, otherwise the file download will be corrupted.
                if (requestData.dataType.toLowerCase() === 'blob') {
                    xhr.responseType = 'blob';
                }
                
                // Standard JWT/Bearer Token
                if (requestData.bearerToken) {
                    xhr.setRequestHeader('Authorization', 'Bearer ' + requestData.bearerToken);
                }
                
                // Use a custom header name (e.g., X-Auth-Token).
                if (requestData.xAuthToken) {
                    xhr.setRequestHeader('X-Auth-Token', requestData.xAuthToken);
                }

                // Monitor upload progress
                xhr.upload.onprogress = function(event) {
                    if (event.lengthComputable) {
                        const percentComplete = Math.ceil((event.loaded / event.total) * 100);
                        // Progress Callback
                        if ((typeof progressCallBack) === 'function') {
                            progressCallBack(percentComplete);
                        }
                    }
                };

                // Handle the response
                xhr.onload = function() {
                    safeFinalFunc();
                    if (xhr.status >= 200 && xhr.status < 300) {
                        let responseData;
                        switch (requestData.dataType.toLowerCase()) {
                            case 'json':
                                responseData = JSON.parse(xhr.responseText);
                                break;
                            case 'blob':
                                responseData = xhr.response;
                                break;
                            default:
                                responseData = xhr.responseText;
                                break;
                        }

                        // Callback
                        if ((typeof callBack) === 'function') {
                            callBack(responseData);
                        }
                    }
                    else {
                        throw new Error(xhr.statusText);
                    }
                };

                // Handle network errors
                xhr.onerror = function() {
                    safeFinalFunc();
                    alert('Unstable network, please check your network connection.');
                };

                // Handle server errors
                xhr.onabort = function() {
                    safeFinalFunc();
                    alert('Request aborted.');
                };

                xhr.ontimeout = function() {
                    safeFinalFunc();
                    alert('Request timed out.');
                };

                // Send the form data
                xhr.send(formData);
            } catch (error) {
                safeFinalFunc();
                let alertMessage = error.message;
                if (error.message.includes('NetworkError')) {
                    alertMessage = 'Unstable network, please check your network connection.';
                } 
                else if (error.message.includes('404')) {
                    alertMessage = 'The requested page not found.';
                } 
                else if (error.message.includes('500')) {
                    alertMessage = 'Internal Server Error.';
                }
                alert(alertMessage);
                return false;
            }
        }
    }

    /**
     * Initializes AJAX forms with validation and submission handling
     * @param {NodeList|string} formObject - Form elements or selector
     */
    initForm(formObject) {
        const thisInstance = this;

        // Default to selecting all relevant elements if none provided
        if (!thisInstance.isValue(formObject)) {
            formObject = document.querySelectorAll('form[data-ajax="1"]');
        }

        if (formObject.length > 0) {
            formObject.forEach(function(form) {
                const showTips = ((!thisInstance.isMatch(form.getAttribute('data-showtips'), false)) && (!thisInstance.isMatch(form.getAttribute('data-showtips'), 0)));
                const busyMode = (thisInstance.isValue(form.getAttribute('data-busy'))) ? form.getAttribute('data-busy') : true;
                const alertResult = (thisInstance.isValue(form.getAttribute('data-alert'))) ? true : false;

                form.removeAttribute('data-ajax');
                form.removeAttribute('data-showtips');
                form.removeAttribute('data-busy');
                form.removeAttribute('data-alert');
                form.method = 'post';
                form.autocomplete = 'off';

                // Bind event for form submit
                form.addEventListener('submit', thisInstance.deBounce(function() {
                    // Remove error & tips
                    const tipsMessageArea = document.querySelector('div.iweby-tips-message');
                    if (tipsMessageArea) {
                        tipsMessageArea.classList.remove('error');
                        tipsMessageArea.classList.remove('success');
                        tipsMessageArea.innerHTML = '';
                    }

                    const errorElements = form.querySelectorAll('.error');
                    errorElements.forEach(function(e) {
                        if (!e.closest('div.iweby-tips-message')) {
                            e.classList.remove('error');
                        }
                    });

                    const tipsElements = form.querySelectorAll('small.tips');
                    tipsElements.forEach(function(tips) {
                        tips.remove();
                    });

                    // Do checking before submit
                    let canSubmit = true;
                    const requiredInputs = form.querySelectorAll('input[data-validation]:not(:disabled), select[data-validation]:not(:disabled), textarea[data-validation]:not(:disabled)');
                    if (requiredInputs.length > 0) {
                        requiredInputs.forEach(function(input) {
                            const validationArray = (input.getAttribute('data-validation').toString().split('|'));
                            if (thisInstance.isMatch(input.type, 'checkbox')) {
                                if (validationArray.includes('required') && input.closest('div.iweby-checkbox-set') && !input.closest('div.iweby-checkbox-set').querySelector('input[type="checkbox"]:checked')) {
                                    if (showTips && !input.closest('div.iweby-checkbox-set').querySelector('small.tips')) {
                                        const errorTips = document.createElement('small');
                                        errorTips.classList.add('tips');
                                        errorTips.textContent = thisInstance.language[thisInstance.currentLangCode]['errorRequired'];
                                        input.closest('div.iweby-checkbox-set').appendChild(errorTips);
                                    }
                                    input.closest('div.iweby-checkbox').classList.add('error');
                                    canSubmit = false;
                                }
                            } 
                            else if (thisInstance.isMatch(input.type, 'radio')) {
                                if (validationArray.includes('required') && input.closest('div.iweby-radio-set') && !input.closest('div.iweby-radio-set').querySelector('input[type="radio"]:checked')) {
                                    if (showTips && !input.closest('div.iweby-radio-set').querySelector('small.tips')) {
                                        const errorTips = document.createElement('small');
                                        errorTips.classList.add('tips');
                                        errorTips.textContent = thisInstance.language[thisInstance.currentLangCode]['errorRequired'];
                                        input.closest('div.iweby-radio-set').appendChild(errorTips);
                                    }
                                    input.closest('div.iweby-radio').classList.add('error');
                                    canSubmit = false;
                                }
                            } 
                            else if (thisInstance.isMatch(input.type, 'select-one') || thisInstance.isMatch(input.type, 'select-multiple')) {
                                if (validationArray.includes('required') && !thisInstance.isValue(input.value)) {
                                    if (showTips && !input.closest('div.iweby-select').querySelector('small.tips')) {
                                        const errorTips = document.createElement('small');
                                        errorTips.classList.add('tips');
                                        errorTips.textContent = thisInstance.language[thisInstance.currentLangCode]['errorRequired'];
                                        input.closest('div.iweby-select').appendChild(errorTips);
                                    }
                                    input.closest('div.iweby-select').classList.add('error');
                                    canSubmit = false;
                                }
                            } 
                            else {
                                if (validationArray.includes('required') && !thisInstance.isValue(input.value)) {
                                    if (showTips && !input.closest('div.iweby-input').querySelector('small.tips')) {
                                        const errorTips = document.createElement('small');
                                        errorTips.classList.add('tips');
                                        errorTips.textContent = thisInstance.language[thisInstance.currentLangCode]['errorRequired'];
                                        input.closest('div.iweby-input').appendChild(errorTips);
                                    }
                                    input.closest('div.iweby-input').classList.add('error');
                                    canSubmit = false;
                                } 
                                else if (thisInstance.isValue(input.value)) {
                                    let nextRegex = true;
                                    if ((validationArray.includes('number')) && !thisInstance.isNumber(input.value)) {
                                        if (showTips && !input.closest('div.iweby-input').querySelector('small.tips')) {
                                            const errorTips = document.createElement('small');
                                            errorTips.classList.add('tips');
                                            errorTips.textContent = thisInstance.language[thisInstance.currentLangCode]['errorNumberFormat'];
                                            input.closest('div.iweby-input').appendChild(errorTips);
                                        }
                                        input.closest('div.iweby-input').classList.add('error');
                                        canSubmit = false;
                                        nextRegex = false;
                                    } 
                                    else if ((validationArray.includes('email')) && !thisInstance.isEmail(input.value)) {
                                        if (showTips && !input.closest('div.iweby-input').querySelector('small.tips')) {
                                            const errorTips = document.createElement('small');
                                            errorTips.classList.add('tips');
                                            errorTips.textContent = thisInstance.language[thisInstance.currentLangCode]['errorEmailFormat'];
                                            input.closest('div.iweby-input').appendChild(errorTips);
                                        }
                                        input.closest('div.iweby-input').classList.add('error');
                                        canSubmit = false;
                                        nextRegex = false;
                                    } 
                                    else if ((validationArray.includes('password')) && !thisInstance.isPassword(input.value)) {
                                        if (showTips && !input.closest('div.iweby-input').querySelector('small.tips')) {
                                            const errorTips = document.createElement('small');
                                            errorTips.classList.add('tips');
                                            errorTips.textContent = thisInstance.language[thisInstance.currentLangCode]['errorPasswordFormat'];
                                            input.closest('div.iweby-input').appendChild(errorTips);
                                        }
                                        input.closest('div.iweby-input').classList.add('error');
                                        canSubmit = false;
                                        nextRegex = false;
                                    } 
                                    else if ((validationArray.includes('date')) && !thisInstance.isDate(input.value)) {
                                        if (showTips && !input.closest('div.iweby-input').querySelector('small.tips')) {
                                            const errorTips = document.createElement('small');
                                            errorTips.classList.add('tips');
                                            errorTips.textContent = thisInstance.language[thisInstance.currentLangCode]['errorDateFormat'];
                                            input.closest('div.iweby-input').appendChild(errorTips);
                                        }
                                        input.closest('div.iweby-input').classList.add('error');
                                        canSubmit = false;
                                        nextRegex = false;
                                    } 
                                    else if ((validationArray.includes('time')) && !thisInstance.isTime(input.value)) {
                                        if (showTips && !input.closest('div.iweby-input').querySelector('small.tips')) {
                                            const errorTips = document.createElement('small');
                                            errorTips.classList.add('tips');
                                            errorTips.textContent = thisInstance.language[thisInstance.currentLangCode]['errorTimeFormat'];
                                            input.closest('div.iweby-input').appendChild(errorTips);
                                        }
                                        input.closest('div.iweby-input').classList.add('error');
                                        canSubmit = false;
                                        nextRegex = false;
                                    } 
                                    else if ((validationArray.includes('ge0'))) {
                                        if (!thisInstance.isNumber(input.value)) {
                                            if (showTips && !input.closest('div.iweby-input').querySelector('small.tips')) {
                                                const errorTips = document.createElement('small');
                                                errorTips.classList.add('tips');
                                                errorTips.textContent = thisInstance.language[thisInstance.currentLangCode]['errorNumberFormat'];
                                                input.closest('div.iweby-input').appendChild(errorTips);
                                            }
                                            input.closest('div.iweby-input').classList.add('error');
                                            canSubmit = false;
                                            nextRegex = false;
                                        } 
                                        else {
                                            const regex = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;
                                            if (!regex.test(input.value)) {
                                                if (showTips && !input.closest('div.iweby-input').querySelector('small.tips')) {
                                                    const errorTips = document.createElement('small');
                                                    errorTips.classList.add('tips');
                                                    errorTips.textContent = thisInstance.language[thisInstance.currentLangCode]['errorGE0'];
                                                    input.closest('div.iweby-input').appendChild(errorTips);
                                                }
                                                input.closest('div.iweby-input').classList.add('error');
                                                canSubmit = false;
                                                nextRegex = false;
                                            }
                                        }
                                    } 
                                    else if ((validationArray.includes('gt0'))) {
                                        if (!thisInstance.isNumber(input.value)) {
                                            if (showTips && !input.closest('div.iweby-input').querySelector('small.tips')) {
                                                const errorTips = document.createElement('small');
                                                errorTips.classList.add('tips');
                                                errorTips.textContent = thisInstance.language[thisInstance.currentLangCode]['errorNumberFormat'];
                                                input.closest('div.iweby-input').appendChild(errorTips);
                                            }
                                            input.closest('div.iweby-input').classList.add('error');
                                            canSubmit = false;
                                            nextRegex = false;
                                        } 
                                        else if (parseFloat(input.value) <= 0) {
                                            if (showTips && !input.closest('div.iweby-input').querySelector('small.tips')) {
                                                const errorTips = document.createElement('small');
                                                errorTips.classList.add('tips');
                                                errorTips.textContent = thisInstance.language[thisInstance.currentLangCode]['errorGT0'];
                                                input.closest('div.iweby-input').appendChild(errorTips);
                                            }
                                            input.closest('div.iweby-input').classList.add('error');
                                            canSubmit = false;
                                            nextRegex = false;
                                        }
                                    }

                                    if (nextRegex && validationArray.includes('regex')) {
                                        const regex = new RegExp(input.getAttribute('data-regex'));
                                        const regexError = input.getAttribute('data-error');
                                        if (!regex.test(input.value.toString().toLowerCase())) {
                                            if (showTips && !input.closest('div.iweby-input').querySelector('small.tips') && thisInstance.isValue(regexError)) {
                                                const errorTips = document.createElement('small');
                                                errorTips.classList.add('tips');
                                                errorTips.textContent = regexError.toString();
                                                input.closest('div.iweby-input').appendChild(errorTips);
                                            }
                                            input.closest('div.iweby-input').classList.add('error');
                                            canSubmit = false;
                                        }
                                    }
                                }
                            }
                        });
                    }

                    // Extra checking if need
                    let extraCanSubmit = true;
                    const validationFunc = form.getAttribute('data-vfunc');
                    if (canSubmit && (typeof window[validationFunc]) === 'function') {
                        extraCanSubmit = window[validationFunc](canSubmit);
                    }

                    if (canSubmit && extraCanSubmit) {
                        let requestData = {
                            method: 'POST',
                            url: form.action,
                            payload: {},
                            includedToken: true,
                            dataType: 'json',
                            showBusy: busyMode
                        };

                        // Iterate over form data
                        const formData = new FormData(form);
                        formData.forEach(function(value, key) {
                            const regex = /(.*)((\[)(.*)(\]))$/i; // Regular expression
                            const match = key.match(regex);
                            if (match) {
                                let baseName = match[1];
                                let childIndex = match[4]
                                if (!requestData.payload[baseName]) {
                                    requestData.payload[baseName] = {};
                                }
                                if (!thisInstance.isValue(childIndex)) {
                                    childIndex = Object.keys(requestData.payload[baseName]).length + 1;
                                }
                                requestData.payload[baseName][childIndex] = value;
                            } 
                            else {
                                requestData.payload[key] = value;
                            }
                        });

                        thisInstance.doRequest(requestData, function(responseData) {
                            // Callback
                            const completeFunc = form.getAttribute('data-cfunc');
                            const extraFunc = form.getAttribute('data-efunc');
                            if ((typeof window[completeFunc]) === 'function') {
                                window[completeFunc](responseData);
                            } 
                            else {   
                                if(thisInstance.isMatch(responseData.status, 200)) {
                                    if (thisInstance.isValue(responseData.url)) {
                                        if (thisInstance.isMatch(alertResult, true) || thisInstance.isMatch(alertResult, 1)) {
                                            thisInstance.alert(responseData.message, function() {
                                                if (!thisInstance.isMatch(responseData.url, '#')) {
                                                    window.location.href = responseData.url;
                                                } 
                                                else {
                                                    window.location.reload();
                                                }
                                            });
                                        }
                                        else {
                                            if (!thisInstance.isMatch(responseData.url, '#')) {
                                                window.location.href = responseData.url;
                                            } 
                                            else {
                                                window.location.reload();
                                            }
                                        }
                                        return;
                                    }
                                }
                                
                                thisInstance.tipsMsg(responseData.message, (thisInstance.isValue(responseData.status) && thisInstance.isMatch(responseData.status, 200)));
                                
                                if ((typeof window[extraFunc]) === 'function') {
                                    window[extraFunc](responseData);
                                }
                            }
                        });
                    } 
                    else if (!canSubmit && extraCanSubmit) {
                        const tipsMessageArea = document.querySelector('div.iweby-tips-message');
                        if (tipsMessageArea) {
                            thisInstance.tipsMsg(thisInstance.language[thisInstance.currentLangCode]['errorRequiredAll'], false);
                        }
                        thisInstance.scrollTo('.error');
                    }
                    
                    return false;
                }));

                // Bind event for form reset
                form.addEventListener('reset', thisInstance.deBounce(function() {
                    const resetElements = form.querySelectorAll('input, select, textarea');
                    if (resetElements.length > 0) {
                        resetElements.forEach(function(element) {
                            if (thisInstance.isMatch(element.type, 'checkbox') ||
                                thisInstance.isMatch(element.type, 'radio') ||
                                thisInstance.isMatch(element.type, 'select-one') ||
                                thisInstance.isMatch(element.type, 'select-multiple')) {
                                element.dispatchEvent(new Event('change', {
                                    bubbles: true
                                }));
                            } 
                            else {
                                if (element.closest('div.iweby-input-autocomplete')) {
                                    // Remove error & tips
                                    element.closest('div.iweby-input-autocomplete').classList.remove('error');
                                    const oriSmallTips = element.closest('div.iweby-input-autocomplete').querySelector('small.tips');
                                    if(oriSmallTips) {
                                        oriSmallTips.remove();
                                    }

                                    const fillID = element.closest('div.iweby-input-autocomplete').querySelector('input.fill-id');
                                    const fillText = element.closest('div.iweby-input-autocomplete').querySelector('input.fill-text');
                                    const oriFillReset = element.closest('div.iweby-input-autocomplete').querySelector('a.fill-reset');
                                    if(oriFillReset) {
                                        oriFillReset.remove();
                                    }

                                    if (thisInstance.isValue(fillText.getAttribute('data-value')) && thisInstance.isValue(fillText.getAttribute('data-default'))) {
                                        fillID.value = fillText.getAttribute('data-value');
                                        fillText.value = fillText.getAttribute('data-default');
                                        fillText.readOnly = false;

                                        // Create reset button
                                        const fillReset = document.createElement('a');
                                        fillReset.classList.add('fill-reset');

                                        // Create Reset icon
                                        const fillResetIcon = document.createElement('i');
                                        fillResetIcon.classList.add('fa');
                                        fillResetIcon.classList.add('fa-times');
                                        fillResetIcon.style.color = '#d73d32';

                                        // Append elements
                                        fillReset.appendChild(fillResetIcon);
                                        element.closest('div.iweby-input-autocomplete').appendChild(fillReset);
                                    }
                                } 
                                else {
                                    element.dispatchEvent(new Event('input', {
                                        bubbles: true
                                    }));
                                }
                            }
                        });
                    }
                }, 100, false));
            });
        }
    }

    /**
     * Opens file uploader dialog with preview and batch upload support
     * @param {Object} options - Upload configuration
     * @param {string} options.url - Upload endpoint URL
     * @param {number} options.maxFiles - Maximum number of files (default: 8)
     * @param {string} options.allowedTypes - Pipe-separated allowed file extensions
     * @param {number} options.maxFileSize - Maximum file size in MB
     * @param {Function} callBack - Callback after upload completes
     */
    uploader(options, callBack) {
        const thisInstance = this;

        // Create input file
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.multiple = true;
        fileInput.addEventListener('change', thisInstance.deBounce(function(e) {
            const fileInput = this;
            const target = e.target;

            // Max files limit
            const maxFiles = Math.max(1, (thisInstance.isValue(options) && thisInstance.isValue(options.maxFiles))?parseInt(options.maxFiles):8);
            let selectedFiles = fileInput.files;
            if (selectedFiles.length > maxFiles) {
                selectedFiles = Array.from(selectedFiles).slice(0, maxFiles);
            }
            thisInstance.uploaderFiles.selectedFiles = selectedFiles;
            thisInstance.uploaderFilesIgnore.selectedFiles = [-1];
            thisInstance.uploaderOptions.selectedFiles = {
                method: 'POST',
                url: '',
                payload: {},
                includedToken: true,
                dataType: 'json',
                showBusy: false,
                
                allowedTypes: '',
                maxFileSize: 64,
                typeErrorMessage: thisInstance.language[thisInstance.currentLangCode]['errorFileType'],
                maxErrorMessage: thisInstance.language[thisInstance.currentLangCode]['errorMaxFileSize'],
                btnStartAll: '<i class="fa fa-cloud-upload" aria-hidden="true"></i>',
                btnClose: '<i class="fa fa-close" aria-hidden="true"></i>',
                btnStart: '<i class="fa fa-cloud-upload" aria-hidden="true"></i>',
                btnRemove: '<i class="fa fa-trash" aria-hidden="true"></i>',
                autoClose: false
            };
            if (thisInstance.isValue(options)) {
                Object.assign(thisInstance.uploaderOptions.selectedFiles, options);
            }
            if (thisInstance.isValue(thisInstance.uploaderOptions.selectedFiles.allowedTypes)) {
                thisInstance.uploaderOptions.selectedFiles.allowedTypes = thisInstance.uploaderOptions.selectedFiles.allowedTypes.split('|');
            }
            thisInstance.uploaderOptions.selectedFiles.maxErrorMessage = thisInstance.uploaderOptions.selectedFiles.maxErrorMessage.replace('{num}', thisInstance.uploaderOptions.selectedFiles.maxFileSize);

            // Create upload panel
            if (thisInstance.isValue(thisInstance.uploaderOptions.selectedFiles.url) && thisInstance.uploaderFiles.selectedFiles.length > 0) {
                // Create div for button
                const uploaderDiv = document.createElement('div');
                uploaderDiv.classList.add('action');

                const startAllButton = document.createElement('button');
                startAllButton.type = 'button';
                startAllButton.classList.add('start-all');
                startAllButton.innerHTML = thisInstance.uploaderOptions.selectedFiles.btnStartAll;

                const closeAllButton = document.createElement('button');
                closeAllButton.type = 'button';
                closeAllButton.classList.add('close');
                closeAllButton.innerHTML = thisInstance.uploaderOptions.selectedFiles.btnClose;

                uploaderDiv.appendChild(startAllButton);
                uploaderDiv.appendChild(closeAllButton);

                // Create div for list
                const listContainer = document.createElement('div');
                listContainer.classList.add('list');

                // Append elements
                const dialogContent = document.createElement('div');
                dialogContent.appendChild(uploaderDiv);
                dialogContent.appendChild(listContainer);

                // Preview list
                thisInstance.dialog(dialogContent.innerHTML, function() {
                    thisInstance.uploaderPreview(thisInstance.uploaderFiles.selectedFiles);

                    // Event handlers
                    const startAllButton = document.querySelector('div.iweby-info-dialog.uploader > div > div.content > div > div.action > button.start-all');
                    const closeAllButton = document.querySelector('div.iweby-info-dialog.uploader > div > div.content > div > div.action > button.close');
                    const listContainer = document.querySelector('div.iweby-info-dialog.uploader > div > div.content > div > div.list');

                    startAllButton.addEventListener('click', thisInstance.deBounce(function() {
                        const items = listContainer.querySelectorAll('div.item');
                        let loopUploadIndex = [];
                        items.forEach(function(item) {
                            loopUploadIndex.push(item.getAttribute('data-index').toString());
                        });
                        thisInstance.uploaderStart(-1, loopUploadIndex, loopUploadIndex[loopUploadIndex.length - 1]);
                    }));

                    closeAllButton.addEventListener('click', thisInstance.deBounce(function() {
                        document.querySelector('div.iweby-info-dialog.uploader > div > div.content > a.btn-close').dispatchEvent(new Event('click', {
                            bubbles: true
                        }));
                    }));

                    listContainer.querySelectorAll('div.item > button.start').forEach(function(button) {
                        button.addEventListener('click', thisInstance.deBounce(function(e1) {
                            const target = e1.target;
                            thisInstance.uploaderStart(target.closest('div.item').getAttribute('data-index'));
                        }));
                    });

                    listContainer.querySelectorAll('div.item > button.remove').forEach(function(button) {
                        button.addEventListener('click', thisInstance.deBounce(function(e2) {
                            const target = e2.target;
                            thisInstance.uploaderFilesIgnore.selectedFiles.push(target.closest('div.item').getAttribute('data-index').toString());
                            target.closest('div.item').remove();
                            if (listContainer.querySelectorAll('div.item').length === 0) {
                                document.querySelector('div.iweby-info-dialog.uploader > div > div.content > a.btn-close').dispatchEvent(new Event('click', {
                                    bubbles: true
                                }));
                            }
                        }));
                    });
                }, function() {
                    // Callback
                    if ((typeof callBack) === 'function') {
                        callBack();
                    }
                }, 'uploader');
            }
        }));

        // Auto click
        fileInput.click();
    }

    /**
     * Sets up drag-and-drop file upload area
     * @param {string} fileInputID - ID of the file input element
     * @param {Object} options - Upload configuration
     * @param {Function} callBack - Callback after upload completes
     */
    uploaderArea(fileInputID, options, callBack) {
        const thisInstance = this;

        // Create input file
        const fileInput = document.getElementById(fileInputID);
        fileInput.removeAttribute('name');
        fileInput.multiple = true;
        fileInput.addEventListener('change', thisInstance.deBounce(function(e) {
            const fileInput = this;
            const target = e.target;

            // Max 8 files
            const maxFiles = Math.max(1, (thisInstance.isValue(options) && thisInstance.isValue(options.maxFiles))?parseInt(options.maxFiles):8);
            let selectedFiles = fileInput.files;
            if (selectedFiles.length > maxFiles) {
                selectedFiles = Array.from(selectedFiles).slice(0, maxFiles);
            }
            thisInstance.uploaderFiles['inline_selectedFiles_' + thisInstance.md5.hash(fileInputID)] = selectedFiles;
            thisInstance.uploaderFilesIgnore['inline_selectedFiles_' + thisInstance.md5.hash(fileInputID)] = [-1];
            thisInstance.uploaderOptions['inline_selectedFiles_' + thisInstance.md5.hash(fileInputID)] = {
                method: 'POST',
                url: '',
                payload: {},
                includedToken: true,
                dataType: 'json',
                showBusy: false,
                
                allowedTypes: '',
                maxFileSize: 64,
                typeErrorMessage: thisInstance.language[thisInstance.currentLangCode]['errorFileType'],
                maxErrorMessage: thisInstance.language[thisInstance.currentLangCode]['errorMaxFileSize'],
                btnStartAll: '<i class="fa fa-cloud-upload" aria-hidden="true"></i>',
                btnClose: '<i class="fa fa-close" aria-hidden="true"></i>',
                btnStart: '<i class="fa fa-cloud-upload" aria-hidden="true"></i>',
                btnRemove: '<i class="fa fa-trash" aria-hidden="true"></i>',
                autoClose: false
            };
            if (thisInstance.isValue(options)) {
                thisInstance.uploaderOptions['inline_selectedFiles_' + thisInstance.md5.hash(fileInputID)] = Object.assign(
                    thisInstance.uploaderOptions['inline_selectedFiles_' + thisInstance.md5.hash(fileInputID)],
                    options
                );
            }
            if (thisInstance.isValue(thisInstance.uploaderOptions['inline_selectedFiles_' + thisInstance.md5.hash(fileInputID)].allowedTypes)) {
                thisInstance.uploaderOptions['inline_selectedFiles_' + thisInstance.md5.hash(fileInputID)].allowedTypes = thisInstance.uploaderOptions['inline_selectedFiles_' + thisInstance.md5.hash(fileInputID)].allowedTypes.split('|');
            }
            thisInstance.uploaderOptions['inline_selectedFiles_' + thisInstance.md5.hash(fileInputID)].maxErrorMessage = thisInstance.uploaderOptions['inline_selectedFiles_' + thisInstance.md5.hash(fileInputID)].maxErrorMessage.replace('{num}', thisInstance.uploaderOptions['inline_selectedFiles_' + thisInstance.md5.hash(fileInputID)].maxFileSize);

            if (thisInstance.isValue(thisInstance.uploaderOptions['inline_selectedFiles_' + thisInstance.md5.hash(fileInputID)].url) && fileInput.files.length > 0) {
                const uploaderAreDiv = target.closest('div.iweby-files-dropzone').querySelector('div.iweby-files-uploader');

                // Create div for button
                const uploaderDiv = document.createElement('div');
                uploaderDiv.className = 'action';

                const startAllButton = document.createElement('button');
                startAllButton.className = 'start-all';
                startAllButton.type = 'button';
                startAllButton.title = 'Start All';
                startAllButton.innerHTML = '<i class="fa fa-cloud-upload" aria-hidden="true"></i>';

                const closeAllButton = document.createElement('button');
                closeAllButton.className = 'close';
                closeAllButton.type = 'button';
                closeAllButton.innerHTML = '<i class="fa fa-close" aria-hidden="true"></i>';

                const listContainer = document.createElement('div');
                listContainer.classList.add('list');

                // Append elements
                uploaderDiv.appendChild(startAllButton);
                uploaderDiv.appendChild(closeAllButton);
                uploaderAreDiv.appendChild(uploaderDiv);
                uploaderAreDiv.appendChild(listContainer);

                // Preview list
                thisInstance.uploaderPreview(thisInstance.uploaderFiles['inline_selectedFiles_' + thisInstance.md5.hash(fileInputID)], 0, fileInputID);

                // Event handlers
                startAllButton.addEventListener('click', thisInstance.deBounce(function() {
                    const items = listContainer.querySelectorAll('div.item');
                    let loopUploadIndex = [];
                    items.forEach(function(item) {
                        loopUploadIndex.push(item.getAttribute('data-index').toString());
                    });
                    thisInstance.uploaderStart(-1, loopUploadIndex, loopUploadIndex[loopUploadIndex.length - 1], fileInputID);
                }));

                closeAllButton.addEventListener('click', thisInstance.deBounce(function() {
                    uploaderAreDiv.innerHTML = '';
                    fileInput.value = '';
                    // Callback
                    if ((typeof callBack) === 'function') {
                        callBack();
                    }
                }));

                listContainer.querySelectorAll('div.item > button.start').forEach(function(button) {
                    button.addEventListener('click', thisInstance.deBounce(function(e1) {
                        const target = e1.target;
                        thisInstance.uploaderStart(target.closest('div.item').getAttribute('data-index'), null, null, fileInputID);
                    }));
                });

                listContainer.querySelectorAll('div.item > button.remove').forEach(function(button) {
                    button.addEventListener('click', thisInstance.deBounce(function(e2) {
                        const target = e2.target;
                        thisInstance.uploaderFilesIgnore['inline_selectedFiles_' + thisInstance.md5.hash(fileInputID)].push(target.closest('div.item').getAttribute('data-index').toString());
                        target.closest('div.item').remove();
                        if (listContainer.querySelectorAll('div.item').length === 0) {
                            uploaderAreDiv.innerHTML = '';
                            fileInput.value = '';
                        }
                    }));
                });
            }
        }));

        // Append elements
        const parent = fileInput.parentElement;
        parent.id = fileInputID + '-iweby-files-dropzone';
        parent.classList.add('iweby-files-dropzone');

        const uploaderDiv = document.createElement('div');
        uploaderDiv.className = 'iweby-files-uploader';
        parent.appendChild(uploaderDiv);
    }

    /**
     * Renders file preview items in the uploader
     * @param {FileList} selectingFiles - Files to preview
     * @param {number} key - Current file index
     * @param {string} fileInputID - Optional file input ID for inline uploaders
     */
    uploaderPreview(selectingFiles, key = 0, fileInputID) {
        const thisInstance = this;
        const regex = /^(.*)(.jpg|.jpeg|.gif|.png|.bmp)$/;

        if (key >= selectingFiles.length) return; // Exit if there are no more files

        let file = selectingFiles[key];
        let extension = file.name.split('.').pop().toLowerCase();
        let checking = true;

        const itemDiv = document.createElement('div');
        itemDiv.classList.add('item');
        itemDiv.setAttribute('data-index', key);

        const photoDiv = document.createElement('div');
        photoDiv.classList.add('photo');
        const imgElement = document.createElement('img');

        if (regex.test(file.name.toLowerCase()) && (typeof(FileReader) !== 'undefined')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imgElement.src = e.target.result;
                photoDiv.appendChild(imgElement);
            };
            reader.readAsDataURL(file);
        } 
        else {
            const fileIcons = {
                pdf: '<i class="fa fa-file-pdf-o" aria-hidden="true" style="color:#ef4130;"></i>',
                doc: '<i class="fa fa-file-word-o" aria-hidden="true" style="color:#5091cd;"></i>',
                docx: '<i class="fa fa-file-word-o" aria-hidden="true" style="color:#5091cd;"></i>',
                xls: '<i class="fa fa-file-excel-o" aria-hidden="true" style="color:#66cdaa;"></i>',
                xlsx: '<i class="fa fa-file-excel-o" aria-hidden="true" style="color:#66cdaa;"></i>',
                ppt: '<i class="fa fa-file-powerpoint-o" aria-hidden="true" style="color:#f7b002;"></i>',
                pptx: '<i class="fa fa-file-powerpoint-o" aria-hidden="true" style="color:#f7b002;"></i>',
                txt: '<i class="fa fa-file-text-o" aria-hidden="true"></i>',
                avi: '<i class="fa fa-file-video-o" aria-hidden="true" style="color:#5091cd;"></i>',
                mov: '<i class="fa fa-file-video-o" aria-hidden="true" style="color:#5091cd;"></i>',
                mp4: '<i class="fa fa-file-video-o" aria-hidden="true" style="color:#5091cd;"></i>',
                ogg: '<i class="fa fa-file-video-o" aria-hidden="true" style="color:#5091cd;"></i>',
                wmv: '<i class="fa fa-file-video-o" aria-hidden="true" style="color:#5091cd;"></i>',
                webm: '<i class="fa fa-file-video-o" aria-hidden="true" style="color:#5091cd;"></i>',
                mp3: '<i class="fa fa-file-audio-o" aria-hidden="true" style="color:#66cdaa;"></i>',
                wav: '<i class="fa fa-file-audio-o" aria-hidden="true" style="color:#66cdaa;"></i>',
                rar: '<i class="fa fa-file-zip-o" aria-hidden="true" style="color:#f7b002;"></i>',
                zip: '<i class="fa fa-file-zip-o" aria-hidden="true" style="color:#f7b002;"></i>'
            };
            photoDiv.innerHTML = fileIcons[extension] || '<i class="fa fa-file-code-o" aria-hidden="true"></i>';
        }

        itemDiv.appendChild(photoDiv);

        const infoDiv = document.createElement('div');
        infoDiv.classList.add('info');

        const titleDiv = document.createElement('div');
        titleDiv.classList.add('title');
        titleDiv.textContent = file.name;
        infoDiv.appendChild(titleDiv);

        const sizeDiv = document.createElement('div');
        sizeDiv.classList.add('size');
        sizeDiv.textContent = thisInstance.formatBytes(file.size, 0);
        infoDiv.appendChild(sizeDiv);

        const hashKey = thisInstance.isValue(fileInputID) ?
            'inline_selectedFiles_' + thisInstance.md5.hash(fileInputID) :
            'selectedFiles';

        const options = thisInstance.uploaderOptions[hashKey];
        const allowedTypes = options.allowedTypes || [];
        const maxFileSize = options.maxFileSize * 1024 * 1024;

        if (allowedTypes.length && allowedTypes.indexOf(extension) < 0) {
            const tipsDiv = document.createElement('div');
            tipsDiv.classList.add('tips');
            tipsDiv.innerHTML = '<small>' + options.typeErrorMessage + '</small>';
            infoDiv.appendChild(tipsDiv);
            checking = false;
        } 
        else if (file.size > maxFileSize) {
            const tipsDiv = document.createElement('div');
            tipsDiv.classList.add('tips');
            tipsDiv.innerHTML = '<small>' + options.maxErrorMessage + '</small>';
            infoDiv.appendChild(tipsDiv);
            checking = false;
        } 
        else {
            const progressBar = document.createElement('div');
            progressBar.classList.add('progress-bar');
            progressBar.innerHTML = '<div class="percent"></div>';
            infoDiv.appendChild(progressBar);
        }

        itemDiv.appendChild(infoDiv);

        if (checking) {
            const startButton = document.createElement('button');
            startButton.type = 'button';
            startButton.classList.add('start');
            startButton.innerHTML = '<i class="fa fa-cloud-upload" aria-hidden="true"></i>';
            itemDiv.appendChild(startButton);
        }

        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.classList.add('remove');
        removeButton.innerHTML = '<i class="fa fa-trash" aria-hidden="true"></i>';
        itemDiv.appendChild(removeButton);

        const dropzone = thisInstance.isValue(fileInputID) ?
            '#' + fileInputID + '-iweby-files-dropzone > div.iweby-files-uploader > div.list' :
            'div.iweby-info-dialog.uploader > div > div.content > div > div.list';

        document.querySelector(dropzone).appendChild(itemDiv);

        // Continue to preview the next file
        thisInstance.uploaderPreview(selectingFiles, key + 1, fileInputID);
    }

    /**
     * Starts file upload for selected files with progress tracking
     * @param {number} index - Current file index
     * @param {Array} loopUploadIndex - Array of file indices to upload
     * @param {number} lastUploadIndex - Last index in the upload queue
     * @param {string} fileInputID - Optional file input ID for inline uploaders
     */
    uploaderStart(index, loopUploadIndex, lastUploadIndex, fileInputID) {
        const thisInstance = this;

        let mainIndex = 'selectedFiles';
        if (thisInstance.isValue(fileInputID)) {
            mainIndex = 'inline_selectedFiles_' + thisInstance.md5.hash(fileInputID);
        }

        // Helper function to safely call if the function is defined
        const safeEndFunction = () => {
            const uploaderDialog = (thisInstance.isValue(fileInputID)) ? document.querySelector('#' + fileInputID + '-iweby-files-dropzone') : document.querySelector('div.iweby-info-dialog.uploader');
            if (uploaderDialog) {
                const startCount = uploaderDialog.querySelectorAll('div.list > div.item > button.start').length;
                if (parseInt(startCount) === 0) {
                    const oriBtnStartAll = uploaderDialog.querySelector('div.action > button.start-all');
                    if(oriBtnStartAll) {
                        oriBtnStartAll.remove();
                    }
                    
                    if (thisInstance.uploaderOptions[mainIndex].autoClose) {
                        uploaderDialog.querySelector('div.action > button.close').dispatchEvent(new Event('click', {
                            bubbles: true
                        }));
                    }
                }
                uploaderDialog.classList.remove('busy');
            }
        };

        const uploaderDialog = (thisInstance.isValue(fileInputID)) ? document.querySelector('#' + fileInputID + '-iweby-files-dropzone') : document.querySelector('div.iweby-info-dialog.uploader');
        uploaderDialog.classList.add('busy');

        // Init
        let isBatch = true;
        if (!thisInstance.isValue(loopUploadIndex)) {
            loopUploadIndex = [index];
            lastUploadIndex = index;
            isBatch = false;
        } 
        else {
            index = index + 1;
        }

        // Upload one by one
        if (parseInt(index) <= parseInt(lastUploadIndex)) {
            if (!loopUploadIndex.includes(index.toString())) {
                if (isBatch) {
                    thisInstance.uploaderStart(index, loopUploadIndex, lastUploadIndex, fileInputID);
                } 
                else {
                    safeEndFunction();
                }
            } 
            else {
                if (thisInstance.isValue(thisInstance.uploaderFiles[mainIndex]) && !thisInstance.uploaderFilesIgnore[mainIndex].includes(index.toString())) {
                    thisInstance.uploaderFilesIgnore[mainIndex].push(index.toString());

                    const selectingFiles = thisInstance.uploaderFiles[mainIndex];
                    const extension = selectingFiles[index].name.split('.').pop().toLowerCase();
                    let checking = true;
                    if (thisInstance.isValue(thisInstance.uploaderOptions[mainIndex].allowedTypes) && !thisInstance.uploaderOptions[mainIndex].allowedTypes.includes(extension.toString())) {
                        checking = false;
                    } 
                    else if (selectingFiles[index].size > thisInstance.uploaderOptions[mainIndex].maxFileSize * 1024 * 1024) {
                        checking = false;
                    }

                    if (checking) {
                        let requestData = {
                            method: 'POST',
                            url: thisInstance.uploaderOptions[mainIndex].url,
                            payload: {},
                            includedToken: true,
                            dataType: 'json',
                            showBusy: false
                        };

                        const formData = new FormData();
                        formData.append('page_action', 'file_upload');
                        if (thisInstance.isValue(thisInstance.uploaderOptions[mainIndex].payload)) {
                            const extraPayload = thisInstance.uploaderOptions[mainIndex].payload;
                            for (let key in extraPayload) {
                                if (extraPayload.hasOwnProperty(key)) {
                                    formData.append(key, extraPayload[key]);
                                }
                            }
                        }
                        formData.append('myfile', selectingFiles[index], selectingFiles[index].name);
                        formData.forEach(function(value, key) {
                            requestData.payload[key] = value;
                        });

                        thisInstance.doRequest(requestData, function(responseData) {
                            const itemDiv = uploaderDialog.querySelector('div.list > div.item[data-index="' + index + '"]');
                            const oriProgressBar = itemDiv.querySelector('div.info > div.progress-bar');
                            if(oriProgressBar) {
                                oriProgressBar.remove();
                            }

                            const message = (responseData.message || responseData);
                            const infoDiv = itemDiv.querySelector('div.info');
                            const tipsDiv = document.createElement('div');
                            tipsDiv.classList.add('tips');
                            tipsDiv.innerHTML = '<small>' + message + '</small>';
                            infoDiv.appendChild(tipsDiv);

                            // Next
                            if (isBatch) {
                                thisInstance.uploaderStart(index, loopUploadIndex, lastUploadIndex, fileInputID);
                            } 
                            else {
                                safeEndFunction();
                            }
                        }, null, function(percentage) {
                            const itemDiv = uploaderDialog.querySelector('div.list > div.item[data-index="' + index + '"]');
                            const oriBtnStart = itemDiv.querySelector('button.start');
                            if(oriBtnStart) {
                                oriBtnStart.remove();
                            }
                            const oriBtnRemove = itemDiv.querySelector('button.remove');
                            if(oriBtnRemove) {
                                oriBtnRemove.remove();
                            }

                            const progressBarPercent = itemDiv.querySelector('div.info > div.progress-bar > div.percent');
                            if (progressBarPercent) {
                                progressBarPercent.style.width = percentage + '%';
                            }
                        });
                    } 
                    else {
                        const itemDiv = uploaderDialog.querySelector('div.list > div.item[data-index="' + index + '"]');
                        const oriBtnStart = itemDiv.querySelector('button.start');
                        if(oriBtnStart) {
                            oriBtnStart.remove();
                        }
                        const oriBtnRemove = itemDiv.querySelector('button.remove');
                        if(oriBtnRemove) {
                            oriBtnRemove.remove();
                        }

                        // Next
                        if (isBatch) {
                            thisInstance.uploaderStart(index, loopUploadIndex, lastUploadIndex, fileInputID);
                        } 
                        else {
                            safeEndFunction();
                        }
                    }
                } 
                else {
                    if (isBatch) {
                        thisInstance.uploaderStart(index, loopUploadIndex, lastUploadIndex, fileInputID);
                    } 
                    else {
                        safeEndFunction();
                    }
                }
            }
        } 
        else {
            safeEndFunction();
        }
    }

    /**
     * Shows an alert dialog with a message
     * @param {string} message - Message to display
     * @param {Function} callBack - Callback after dialog closes
     * @param {string} customizeClassName - Optional custom CSS class
     */
    alert(message, callBack, customizeClassName) {
        // Prevent duplicate dialogs
        if (document.querySelectorAll('div.iweby-alert-dialog').length > 0) {
            return;
        }

        const thisInstance = this;
        if (thisInstance.isValue(message)) {
            // Create div
            const alertDialog = document.createElement('div');
            alertDialog.classList.add('iweby-alert-dialog');
            if (thisInstance.isValue(customizeClassName)) {
                alertDialog.classList.add(customizeClassName);
            }

            const innerDiv = document.createElement('div');
            const contentDiv = document.createElement('div');
            contentDiv.classList.add('content');
            contentDiv.style.transition = 'transform 0.5s ease, opacity 0.5s ease';
            contentDiv.style.transform = 'translateY(-320%)';
            contentDiv.style.opacity = '0';

            const detailsDiv = document.createElement('div');
            detailsDiv.innerHTML = message;

            // Create close button
            const closeButton = document.createElement('button');
            closeButton.type = 'button';
            closeButton.classList.add('btn');
            closeButton.classList.add('btn-close');
            closeButton.textContent = thisInstance.language[thisInstance.currentLangCode]['btnConfirm'];
            closeButton.addEventListener('click', thisInstance.deBounce(function(e) {
                const target = e.target;
                contentDiv.style.transform = 'translateY(-320%)';
                contentDiv.style.transform = '0';
                contentDiv.addEventListener('transitionend', function() {
                    target.closest('div.iweby-alert-dialog').remove();
                    if (document.querySelectorAll('div.iweby-alert-dialog').length === 0 && document.querySelectorAll('div.iweby-info-dialog').length === 0) {
                        document.body.classList.remove('iweby-disable-scroll');
                    }

                    // Callback
                    if ((typeof callBack) === 'function') {
                        callBack();
                    }
                }, {
                    once: true
                });
            }));

            // Append to body
            const viewer = document.querySelector('div.iweby-viewer');
            innerDiv.appendChild(contentDiv);
            contentDiv.appendChild(detailsDiv);
            contentDiv.appendChild(closeButton);
            alertDialog.appendChild(innerDiv);
            viewer.insertBefore(alertDialog, viewer.firstChild);
            document.body.classList.add('iweby-disable-scroll');

            // Show dialog
            setTimeout(function() {
                thisInstance.showBusy(false);
                contentDiv.style.transform = 'translateY(0)';
                contentDiv.style.opacity = '1';
            }, 100);
        }
        else {
            // Callback
            if ((typeof callBack) === 'function') {
                callBack();
            }
        }
    }

    /**
     * Shows a confirmation dialog with Yes/No buttons
     * @param {string} message - Message to display
     * @param {Function} callBack - Callback with boolean result (true=Yes, false=No)
     * @param {string} customizeClassName - Optional custom CSS class
     */
    confirm(message, callBack, customizeClassName) {
        // Prevent duplicate dialogs
        if (document.querySelectorAll('div.iweby-alert-dialog').length > 0) {
            return;
        }

        const thisInstance = this;
        if (thisInstance.isValue(message)) {
            // Create div
            const alertDialog = document.createElement('div');
            alertDialog.classList.add('iweby-alert-dialog');
            if (thisInstance.isValue(customizeClassName)) {
                alertDialog.classList.add(customizeClassName);
            }

            const innerDiv = document.createElement('div');
            const contentDiv = document.createElement('div');
            contentDiv.classList.add('content');
            contentDiv.style.transition = 'transform 0.5s ease, opacity 0.5s ease';
            contentDiv.style.transform = 'translateY(-320%)';
            contentDiv.style.opacity = '0';

            const detailsDiv = document.createElement('div');
            detailsDiv.innerHTML = message;

            // Create the yes/no button
            const yesButton = document.createElement('button');
            yesButton.type = 'button';
            yesButton.classList.add('btn');
            yesButton.classList.add('btn-yes');
            yesButton.textContent = thisInstance.language[thisInstance.currentLangCode]['btnYes'];
            yesButton.addEventListener('click', thisInstance.deBounce(function(e) {
                const target = e.target;
                contentDiv.style.transform = 'translateY(-320%)';
                contentDiv.style.transform = '0';
                contentDiv.addEventListener('transitionend', function() {
                    target.closest('div.iweby-alert-dialog').remove();
                    if (document.querySelectorAll('div.iweby-alert-dialog').length === 0 && document.querySelectorAll('div.iweby-info-dialog').length === 0) {
                        document.body.classList.remove('iweby-disable-scroll');
                    }

                    // Callback
                    if ((typeof callBack) === 'function') {
                        callBack(true);
                    }
                }, {
                    once: true
                });
            }));

            const noButton = document.createElement('button');
            noButton.type = 'button';
            noButton.classList.add('btn');
            noButton.classList.add('btn-no');
            noButton.textContent = thisInstance.language[thisInstance.currentLangCode]['btnNo'];
            noButton.addEventListener('click', thisInstance.deBounce(function(e) {
                const target = e.target;
                contentDiv.style.transform = 'translateY(-320%)';
                contentDiv.style.transform = '0';
                contentDiv.addEventListener('transitionend', function() {
                    target.closest('div.iweby-alert-dialog').remove();
                    if (document.querySelectorAll('div.iweby-alert-dialog').length === 0 && document.querySelectorAll('div.iweby-info-dialog').length === 0) {
                        document.body.classList.remove('iweby-disable-scroll');
                    }

                    // Callback
                    if ((typeof callBack) === 'function') {
                        callBack(false);
                    }
                }, {
                    once: true
                });
            }));

            // Append to body
            const viewer = document.querySelector('div.iweby-viewer');
            innerDiv.appendChild(contentDiv);
            contentDiv.appendChild(detailsDiv);
            contentDiv.appendChild(yesButton);
            contentDiv.appendChild(noButton);
            alertDialog.appendChild(innerDiv);
            viewer.insertBefore(alertDialog, viewer.firstChild);
            document.body.classList.add('iweby-disable-scroll');

            setTimeout(function() {
                thisInstance.showBusy(false);
                contentDiv.style.transform = 'translateY(0)';
                contentDiv.style.opacity = '1';
            }, 100);
        }
        else {
            // Callback
            if ((typeof callBack) === 'function') {
                callBack();
            }
        }
    }

    /**
     * Shows a custom dialog with HTML content
     * @param {string|HTMLElement} htmlContent - HTML content to display
     * @param {Function} initFunc - Callback when dialog opens
     * @param {Function} callBack - Callback when dialog closes
     * @param {string} customizeClassName - Optional custom CSS class
     */
    dialog(htmlContent, initFunc, callBack, customizeClassName) {
        // Prevent duplicate dialogs
        if (document.querySelector('div.iweby-info-dialog')) {
            return;
        }

        const thisInstance = this;
        if (thisInstance.isValue(htmlContent)) {
            // Create div
            const infoDialog = document.createElement('div');
            infoDialog.classList.add('iweby-info-dialog');
            if (thisInstance.isValue(customizeClassName)) {
                infoDialog.classList.add(customizeClassName);
            }

            const innerDiv = document.createElement('div');
            const contentDiv = document.createElement('div');
            contentDiv.classList.add('content');
            contentDiv.style.transition = 'transform 0.5s ease, opacity 0.5s ease';
            contentDiv.style.transform = 'translateY(-320%)';
            contentDiv.style.opacity = '0';

            const detailsDiv = document.createElement('div');
            if ((typeof htmlContent) === 'string') {
                detailsDiv.insertAdjacentHTML('beforeend', htmlContent);
            } 
            else {
                detailsDiv.appendChild(htmlContent);
            }

            // Create the close button
            const closeButton = document.createElement('a');
            closeButton.classList.add('btn');
            closeButton.classList.add('btn-close');
            closeButton.addEventListener('click', thisInstance.deBounce(function(e) {
                const target = e.target;
                contentDiv.style.transform = 'translateY(-320%)';
                contentDiv.style.transform = '0';
                contentDiv.addEventListener('transitionend', function() {
                    target.closest('div.iweby-info-dialog').remove();
                    if (document.querySelectorAll('div.iweby-alert-dialog').length === 0 && document.querySelectorAll('div.iweby-info-dialog').length === 0) {
                        document.body.classList.remove('iweby-disable-scroll');
                    }

                    // Callback
                    if ((typeof callBack) === 'function') {
                        callBack();
                    }
                }, {
                    once: true
                });
            }));

            // Append to body
            const viewer = document.querySelector('div.iweby-viewer');
            innerDiv.appendChild(contentDiv);
            contentDiv.appendChild(detailsDiv);
            contentDiv.appendChild(closeButton);
            infoDialog.appendChild(innerDiv);
            viewer.insertBefore(infoDialog, viewer.firstChild);
            document.body.classList.add('iweby-disable-scroll');

            // Show dialog
            setTimeout(function() {
                thisInstance.showBusy(false);

                // init component & form
                thisInstance.initComponent();

                // Callback
                if ((typeof initFunc) === 'function') {
                    initFunc();
                }

                contentDiv.style.transform = 'translateY(0)';
                contentDiv.style.opacity = '1';
            }, 100);
        }
    }
    
    /**
     * Creates a draggable/resizable modal dialog
     * @param {string} htmlContent - HTML content to display
     * @param {Function} initFunc - Callback when dialog opens
     * @param {Object} options - Modal configuration options
     * @param {string} options.title - Dialog title
     * @param {string} options.ClassName - Custom CSS class
     * @param {number} options.width - Dialog width in pixels
     * @param {number} options.height - Dialog height in pixels
     */
    modalDialog(htmlContent, initFunc, options) {
        const thisInstance = this;
        if(thisInstance.isValue(htmlContent)) {
            options = Object.assign({
                title : '',
                ClassName: '',
                width: 0,
                height: 0,
                init: initFunc
            }, options);
            if(!thisInstance.isValue(options.ClassName)) {
                options.ClassName = 'default';
            }
            new iModalDialog(htmlContent, options);
        }
    }

    /**
     * Shows a tips message (success/error) in the tips area
     * @param {string} message - Message to display
     * @param {boolean} isSuccess - Whether it's a success message
     * @param {Function} callBack - Callback after message is shown
     */
    tipsMsg(message, isSuccess = false, callBack) {
        const thisInstance = this;
        
        if (thisInstance.isValue(message)) {
            let tipsMessageArea = null;
            const popupDialog = document.querySelector('div.iweby-info-dialog') || document.querySelector('div.imodal-dialog.current');
            if(thisInstance.isValue(popupDialog)) {
                tipsMessageArea = popupDialog.querySelector('div.iweby-tips-message');
            }
            else {
                tipsMessageArea = document.querySelector('div.iweby-tips-message');
            }
            
            if (thisInstance.isValue(tipsMessageArea)) {
                const defaultOffset = Math.max(0, (tipsMessageArea.getAttribute('data-offset') || 0));
                tipsMessageArea.classList.remove('error');
                tipsMessageArea.classList.remove('success');
                tipsMessageArea.classList.add(((isSuccess) ? 'success' : 'error'));
                tipsMessageArea.innerHTML = '';
                const divElement = document.createElement('div');
                const closeButton = document.createElement('a');
                closeButton.className = 'close';
                closeButton.textContent = '×';
                const messageSpan = document.createElement('span');
                messageSpan.textContent = message;
                divElement.appendChild(closeButton);
                divElement.appendChild(messageSpan);
                tipsMessageArea.appendChild(divElement);
                thisInstance.scrollTo('div.iweby-tips-message', defaultOffset);
                // Callback
                if ((typeof callBack) === 'function') {
                    callBack();
                }
            }
            else {
                thisInstance.alert(message, callBack);
            }
        } 
        else {
            // Callback
            if ((typeof callBack) === 'function') {
                callBack();
            }
        }
    }

    // --- Event System ---

    /**
     * Binds a custom event to elements matching a selector
     * @param {string} eventType - Event type (click, change, etc.)
     * @param {string} selector - CSS selector for target elements
     * @param {Function} callBack - Callback function receiving (target, event)
     */
    bindEvent(eventType, selector, callBack) {
        const thisInstance = this;

        // If the eventType is not yet handled, set it up
        if (!thisInstance.eventMap[eventType]) {
            thisInstance.eventMap[eventType] = [];

            // Add a single event listener for the document on this event type
            document.addEventListener(eventType, function(e) {
                // Loop through all the registered selectors for this event type
                thisInstance.eventMap[eventType].forEach(function(item) {
                    const target = e.target.closest(item.selector);
                    if (target) {
                        // Call the corresponding callback with the target and event
                        item.callBack(target, e);
                    }
                });
            });
        }

        // Add the selector and its callback to the event map
        thisInstance.eventMap[eventType].push({
            selector,
            callBack
        });
    }

    /**
     * Unbinds a custom event for a specific selector
     * @param {string} eventType - Event type
     * @param {string} selector - CSS selector
     */
    unBindEvent(eventType, selector) {
        if (this.eventMap[eventType]) {
            // Filter out the event listener that matches the selector
            this.eventMap[eventType] = this.eventMap[eventType].filter(item => item.selector !== selector);

            // If there are no more selectors for this event type, clean up
            if (this.eventMap[eventType].length === 0) {
                delete this.eventMap[eventType];
            }
        }
    }

    /**
     * Triggers a custom event on elements matching a selector
     * @param {string} eventType - Event type to trigger
     * @param {string} selector - CSS selector
     */
    triggerEvent(eventType, selector) {
        const target = document.querySelector(selector);
        if (target) {
            // Create a new event with the specified type
            const customEvent = new Event(eventType, {
                bubbles: true, // Allow the event to bubble up
                cancelable: true // Allow the event to be canceled
            });
            target.dispatchEvent(customEvent);
        }
    }

    // --- Validation Methods ---

    /**
     * Checks if a value is defined and non-empty
     * @param {*} value - Value to check
     * @returns {boolean} True if value is defined and non-empty
     */
    isValue(value) {
        if ((typeof value) === 'undefined' || value === null) {
            return false;
        } 
        else if (value instanceof HTMLElement) {
            return value.outerHTML.trim() !== '';
        } 
        else if ((typeof value) === 'object') {
            return Array.isArray(value) ? value.length > 0 : Object.keys(value).length > 0;
        }

        return value.toString().trim() !== '';
    }

    /**
     * Case-insensitive comparison of two values
     * @param {*} value1 - First value
     * @param {*} value2 - Second value
     * @param {boolean} sensitive - Case-sensitive comparison
     * @returns {boolean} True if values match
     */
    isMatch(value1, value2, sensitive = false) {
        const thisInstance = this;

        if (thisInstance.isValue(value1) && thisInstance.isValue(value2)) {
            const trimmedValue1 = (value1.toString().trim());
            const trimmedValue2 = (value2.toString().trim());
            return (sensitive) ? (trimmedValue1 === trimmedValue2) : (trimmedValue1.toLowerCase() === trimmedValue2.toLowerCase());
        }

        return false;
    }

    /**
     * Validates if a value is a number
     * @param {*} value - Value to check
     * @param {boolean} digitalMode - Strict digit-only mode
     * @returns {boolean} True if value is a number
     */
    isNumber(value, digitalMode = false) {
        const thisInstance = this;
        const reg = ((digitalMode) ? /^[0-9]+$/ : /(^((-)?[1-9]{1}\d{0,2}|0\.|0$))(((\d)+)?)(((\.)(\d+))?)$/);

        if (thisInstance.isValue(value)) {
            return reg.test(value);
        }

        return false;
    }

    /**
     * Validates email address format
     * @param {string} value - Email to validate
     * @returns {boolean} True if valid email
     */
    isEmail(value) {
        const thisInstance = this;
        const reg = /^([A-Za-z0-9_\-\.])+@([A-Za-z0-9_\-\.])+\.[A-Za-z]{2,}$/;

        if (thisInstance.isValue(value)) {
            return reg.test(value);
        }

        return false;
    }

    /**
     * Validates password strength (min 6 chars, uppercase, lowercase, number)
     * @param {string} value - Password to validate
     * @returns {boolean} True if password meets criteria
     */
    isPassword(value) {
        const thisInstance = this;
        const reg = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}$/;

        if (thisInstance.isValue(value)) {
            return reg.test(value);
        }

        return false;
    }

    /**
     * Validates date format and validity
     * @param {string} value - Date string to validate
     * @param {string} format - Expected date format (Y-m-d or d/m/Y)
     * @returns {boolean} True if valid date
     */
    isDate(value, format = 'Y-m-d') {
        const thisInstance = this;
        const reg = /^(\d{4})(\-)(\d{2})(\-)(\d{2})$/;

        if (thisInstance.isValue(value)) {
            if (!thisInstance.isMatch(format, 'Y-m-d')) {
                value = value.split('/').reverse().join('-');
            }
            if (reg.test(value)) {
                let ymdChecking = true;
                const parts = value.split('-');
                const day = parseInt(parts[2]);
                const month = parseInt(parts[1]);
                const year = parseInt(parts[0]);
                if (isNaN(day) || isNaN(month) || isNaN(year)) {
                    ymdChecking = false;
                } 
                else {
                    if (year <= 0 || month <= 0 || month > 12 || day <= 0) {
                        ymdChecking = false;
                    } 
                    else if ([1, 3, 5, 7, 8, 10, 12].includes(month) && day > 31) {
                        ymdChecking = false;
                    } 
                    else if ([4, 6, 9, 11].includes(month) && day > 30) {
                        ymdChecking = false;
                    } 
                    else if (month == 2) {
                        const isLeapYear = ((year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0));
                        if ((isLeapYear && day > 29) || (!isLeapYear && day > 28)) {
                            ymdChecking = false;
                        }
                    }
                }

                return ((new Date(value) instanceof Date) && ymdChecking);
            }
        }

        return false;
    }

    /**
     * Validates time format (HH:MM)
     * @param {string} value - Time string to validate
     * @returns {boolean} True if valid time
     */
    isTime(value) {
        const thisInstance = this;
        const reg = /^(\d{2}):(\d{2})$/;

        if (thisInstance.isValue(value)) {
            const match = reg.exec(value);
            if (match) {
                const hours = parseInt(match[1], 10);
                const minutes = parseInt(match[2], 10);
                return (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59);
            }
        }
        return false;
    }

    // --- Conversion Methods ---

    /**
     * Converts bytes to human-readable format
     * @param {number} bytes - Bytes to convert
     * @param {number} decimals - Decimal places
     * @returns {string} Formatted string
     */
    formatBytes(bytes, decimals) {
        if (!bytes) return '0 Bytes';

        const k = 1024;
        const dm = (decimals < 0) ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };
    
    /**
     * Formats numbers with thousand separators and decimal places
     * @param {number|string} value - Number to format
     * @param {boolean} currencyMode - Add thousand separators
     * @param {number} decimal - Decimal places
     * @param {boolean} autoBeautify - Remove trailing zeros
     * @returns {string} Formatted number
     */
    formatNumber(value, currencyMode, decimal = 2, autoBeautify = true) {
        const thisInstance = this;

        value = value.toString().replace(/[^\d|\-|\.]/g, '');
        if (thisInstance.isNumber(value)) {
            if (thisInstance.isNumber(decimal) && parseInt(decimal) > 0) {
                let power10 = Math.pow(10, decimal);
                value = value * power10;
                value = (Math.round(value) / power10).toString();
                let dpp = value.indexOf('.');
                if (dpp < 0) {
                    dpp = value.length;
                    value += '.';
                }
                while (value.length <= dpp + decimal) {
                    value += '0';
                }
            }
            if (autoBeautify) {
                value = value.toString().replace(/(\.\d+?)0+$/g, '$1');
                value = value.toString().replace(/(\.0)$/g, '');
            }
            if (thisInstance.isMatch(currencyMode, true)) {
                const [integerPart, decimalPart] = value.toString().split('.');
                const formattedInteger = integerPart.replace(/(\d)(?=(\d{3})+$)/g, '$1,');
                return decimalPart ? (formattedInteger + '.' + decimalPart) : formattedInteger;
            } 
            else {
                return value;
            }
        }
        return 0;
    }

    /**
     * Formats date/time to various formats
     * @param {Date|string} value - Date value
     * @param {string} format - Output format
     * @returns {string} Formatted date/time
     */
    formatDateTime(value, format = 'Y-m-d H:i:s') {
        const thisInstance = this;

        let now = ((thisInstance.isValue(value)) ? new Date(value) : new Date());
        let year = now.getFullYear();
        let month = now.getMonth() + 1;
        let day = now.getDate();
        let hour = now.getHours();
        let minute = now.getMinutes();
        let second = now.getSeconds();
        if (month.toString().length == 1) {
            month = '0' + month;
        }
        if (day.toString().length == 1) {
            day = '0' + day;
        }
        if (hour.toString().length == 1) {
            hour = '0' + hour;
        }
        if (minute.toString().length == 1) {
            minute = '0' + minute;
        }
        if (second.toString().length == 1) {
            second = '0' + second;
        }

        let dateTime = '';
        switch (format) {
            case 'Y-m-d H:i:s':
                dateTime = year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
                break;
            case 'Y-m-d H:i':
                dateTime = year + '-' + month + '-' + day + ' ' + hour + ':' + minute;
                break;
            case 'd/m/Y H:i:s':
                dateTime = day + '/' + month + '/' + year + ' ' + hour + ':' + minute + ':' + second;
                break;
            case 'd/m/Y H:i':
                dateTime = day + '/' + month + '/' + year + ' ' + hour + ':' + minute;
                break;
            case 'Y-m-d':
                dateTime = year + '-' + month + '-' + day;
                break;
            case 'd/m/Y':
                dateTime = day + '/' + month + '/' + year;
                break;
            case 'H:i:s':
                dateTime = hour + ':' + minute + ':' + second;
                break;
            case 'H:i':
                dateTime = hour + ':' + minute;
                break;
            case 'Y':
                dateTime = year;
                break;
            case 'm':
                dateTime = month;
                break;
            case 'd':
                dateTime = day;
                break;
            case 'h':
                dateTime = hour;
                break;
            case 'i':
                dateTime = minute;
                break;
            case 's':
                dateTime = second;
                break;
        }
        return dateTime;
    }
    
    /**
     * Formats seconds to HH:MM:SS or MM:SS
     * @param {number} seconds - Seconds to format
     * @returns {string} Formatted time string
     */
    formatTime(seconds = 0) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
        return (hrs > 0) ? (hrs.toString().padStart(2, '0') + ':' + mins + ':' + secs) : (mins + ':' + secs);
    }

    // --- Cookie Management ---

    /**
     * Sets a cookie
     * @param {string} key - Cookie name
     * @param {string} value - Cookie value
     * @param {number} exdays - Expiration in days
     */
    setCookie(key, value, exdays = 14) {
        const thisInstance = this;

        if (navigator.cookieEnabled) {
            if (thisInstance.isValue(key)) {
                const d = new Date();
                d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
                const expires = 'expires=' + d.toUTCString();
                const pathParts = window.location.pathname.split('/');
                const projectFolder = ((pathParts.length > 1 && pathParts[1] !== '') ? '/' + pathParts[1] + '/' : '/');
                document.cookie = key + '=' + value + ';' + expires + ';path=' + projectFolder;
            }
        } 
        else {
            alert('Cookies Blocked or not supported by your browser.');
        }
    }

    /**
     * Gets a cookie value
     * @param {string} key - Cookie name
     * @returns {string} Cookie value or empty string
     */
    getCookie(key) {
        const thisInstance = this;

        if (navigator.cookieEnabled) {
            if (thisInstance.isValue(key)) {
                const name = key + '=';
                const ca = document.cookie.split(';');
                for (let i = 0; i < ca.length; i++) {
                    let c = ca[i].trim();
                    if (c.indexOf(name) === 0) {
                        return c.substring(name.length, c.length);
                    }
                }
            }
        } 
        else {
            alert('Cookies Blocked or not supported by your browser.');
        }
        return '';
    }

    /**
     * Deletes a cookie
     * @param {string} key - Cookie name
     */
    deleteCookie(key) {
        const thisInstance = this;
        thisInstance.setCookie(key, '', -1);
    }

    // --- Local Storage Management ---

    /**
     * Sets a value in localStorage with type preservation
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     */
    setLocalStorage(key, value) {
        const thisInstance = this;
        try {
            const data = {
                type: thisInstance.typeOfValue(value),
                value: thisInstance.serializeValue(value)
            };
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            alert(`Write Storage failed [${key}]: ${error}`);
        }
    }

    /**
     * Gets a value from localStorage with type restoration
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if not found
     * @returns {*} Retrieved value
     */
    getLocalStorage(key, defaultValue = null) {
        const thisInstance = this;
        try {
            const item = localStorage.getItem(key);
            if (!item) { return defaultValue; }
            
            const { type, value } = JSON.parse(item);
            return thisInstance.deserializeValue(type, value);
        } catch (error) {
            alert(`Read Storage failed [${key}]: ${error}`);
            return defaultValue;
        }
    }

    /**
     * Deletes a localStorage item
     * @param {string} key - Storage key (if empty, clears all)
     */
    deleteLocalStorage(key) {
        if(key) {
            localStorage.removeItem(key);
        }
        else {
            localStorage.clear();
        }
    }

    /**
     * Determines the type of a value for serialization
     * @param {*} value - Value to check
     * @returns {string} Type string
     */
    typeOfValue(value) {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        if (value instanceof Date) return 'date';
        if (value instanceof Map) return 'map';
        if (value instanceof Set) return 'set';
        if (Array.isArray(value)) return 'array';
        return typeof value;
    }

    /**
     * Serializes a value for storage
     * @param {*} value - Value to serialize
     * @returns {*} Serialized value
     */
    serializeValue(value) {
        if (value === undefined) return null;
        if (value instanceof Date) return value.toISOString();
        if (value instanceof Map) return Array.from(value.entries());
        if (value instanceof Set) return Array.from(value);
        return value;
    }

    /**
     * Deserializes a value from storage
     * @param {string} type - Data type
     * @param {*} value - Serialized value
     * @returns {*} Deserialized value
     */
    deserializeValue(type, value) {
        switch (type) {
            case 'date': return new Date(value);
            case 'map': return new Map(value);
            case 'set': return new Set(value);
            case 'undefined': return undefined;
            default: return value;
        }
    }

    // --- Utility Methods ---

    /**
     * Debounces a function call
     * @param {Function} callBack - Function to debounce
     * @param {number} delay - Delay in milliseconds
     * @param {boolean} prevent - Prevent default behavior
     * @returns {Function} Debounced function
     */
    deBounce(callBack, delay = 100, prevent = true) {
        let timeout;
        return function(e) {
            // Prevent default behavior
            if (prevent) {
                if (e && typeof e.preventDefault === 'function') {
                    e.preventDefault();
                }
            }

            // Clear the previous timer
            clearTimeout(timeout);

            // Capture this for the setTimeout callback
            const context = this;
            const args = arguments;

            // Set a new timer
            timeout = setTimeout(() => callBack.apply(context, args), delay);
        };
    }

    /**
     * Shows/hides a busy/loading indicator
     * @param {boolean|number} status - Show or hide
     * @param {number} value - Opacity value (0-100) or delay for hiding
     */
    showBusy(status, value) {
        const thisInstance = this;

        if (thisInstance.isMatch(status, 1) || thisInstance.isMatch(status, true)) {
            if (document.querySelectorAll('div.iweby-processing').length === 0) {
                // Init opacity based on value
                let opacity = 1;
                if (thisInstance.isNumber(value, true)) {
                    opacity = (Math.round(parseInt(value) / 100 * 100) / 100);
                }

                // Create the main div
                const processingDiv = document.createElement('div');
                processingDiv.classList.add('iweby-processing');
                if (parseFloat(opacity) === 0) {
                    processingDiv.style.opacity = 0;
                } 
                else {
                    processingDiv.style.background = 'rgba(255, 255, 255, ' + opacity + ')';
                }


                // Create the inner loading div
                const loadingDiv = document.createElement('div');
                loadingDiv.classList.add('loading');

                // Create the SVG element
                const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svgElement.setAttribute('width', '48px');
                svgElement.setAttribute('height', '48px');
                svgElement.setAttribute('viewBox', '0 0 100 100');
                svgElement.setAttribute('preserveAspectRatio', 'xMidYMid');

                // Create the circle element
                const circleElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circleElement.setAttribute('cx', '50');
                circleElement.setAttribute('cy', '50');
                circleElement.setAttribute('fill', 'none');
                circleElement.setAttribute('stroke', '#dddddd');
                circleElement.setAttribute('stroke-width', '10');
                circleElement.setAttribute('r', '36');
                circleElement.setAttribute('stroke-dasharray', '169.64600329384882 58.548667764616276');

                // Create the animateTransform element
                const animateTransform = document.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
                animateTransform.setAttribute('attributeName', 'transform');
                animateTransform.setAttribute('type', 'rotate');
                animateTransform.setAttribute('repeatCount', 'indefinite');
                animateTransform.setAttribute('dur', '1s');
                animateTransform.setAttribute('values', '0 50 50;360 50 50');
                animateTransform.setAttribute('keyTimes', '0;1');

                // Append animateTransform to the circle
                circleElement.appendChild(animateTransform);

                // Append circle to the SVG element
                svgElement.appendChild(circleElement);

                // Append the SVG to the loading div
                loadingDiv.appendChild(svgElement);

                // Append the loading div to the main processing div
                processingDiv.appendChild(loadingDiv);

                // Insert the processingDiv into the document body
                document.body.insertBefore(processingDiv, document.body.firstChild);
            }
        } 
        else {
            let microsecond = 0;
            if (thisInstance.isNumber(value, true)) {
                microsecond = parseInt(value);
            }
            setTimeout(function() {
                const processingDivs = document.querySelectorAll('div.iweby-processing');
                processingDivs.forEach(function(div) {
                    div.remove();
                });
            }, microsecond);
        }
    }

    /**
     * Smooth scrolls to an element
     * @param {string} element - CSS selector
     * @param {number} offset - Scroll offset from top
     * @param {Function} callBack - Callback after scroll
     */
    scrollTo(element, offset, callBack) {
        const thisInstance = this;
        const targetElement = document.querySelector(element);

        let elementScrollTopValue = 0;
        if (targetElement) {
            offset = (thisInstance.isValue(offset)) ? parseInt(offset) : 80;
            elementScrollTopValue = Math.max(0, parseInt(targetElement.getBoundingClientRect().top) + window.pageYOffset - offset);   
        }

        // Smooth scrolling
        window.scrollTo({
            top: elementScrollTopValue,
            behavior: 'smooth'
        });

        // Callback
        setTimeout(function() {
            if (Math.abs(window.pageYOffset - elementScrollTopValue) <= 1) {
                if ((typeof callBack) === 'function') {
                    callBack();
                }
            }
        }, 100);
    }
    
    /**
     * Gets the current URL without query parameters
     * @param {string} extra - Optional extra path to append
     * @returns {string} Base URL
     */
    getURL(extra) {
        const thisInstance = this;
        return (window.location.href.split('?')[0]).toString() + ((thisInstance.isValue(extra)) ? ('/' + extra) : '');
    }

    /**
     * Gets a URL parameter value
     * @param {string} name - Parameter name
     * @returns {string} Parameter value or empty string
     */
    getURLParam(name) {
        const thisInstance = this;

        let param = '';
        if (thisInstance.isValue(name)) {
            let urlParams = window.location.search.substring(1).split('&');
            for (let i = 0; i < parseInt(urlParams.length); i++) {
                let currentParam = urlParams[i].split('=');
                let currentParamIndex = currentParam[0];
                let currentParamValue = currentParam[1];
                if (thisInstance.isValue(currentParamIndex) && thisInstance.isValue(currentParamValue)) {
                    if (thisInstance.isMatch(currentParamIndex, name)) {
                        param = currentParamValue;
                        break;
                    }
                }
            }
        }
        return param;
    }

    /**
     * Generates a random integer between min and max (inclusive)
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Random integer
     */
    randomNum(min, max) {
        const thisInstance = this;

        if (!thisInstance.isValue(min) || parseInt(min) < 0) {
            min = 0;
        }
        if (!thisInstance.isValue(max) || parseInt(max) < 1) {
            max = 1;
        }
        min = parseInt(min);
        max = parseInt(max);
        if (parseInt(min) > parseInt(max)) {
            min = 0;
            max = 1;
        }
        return parseInt(Math.random() * (max + 1 - min) + min);
    }

    /**
     * Generates a random alphanumeric string
     * @param {number} length - String length
     * @returns {string} Random string
     */
    randomString(length) {
        const thisInstance = this;

        const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
        if (!thisInstance.isNumber(length)) {
            length = 8;
        }

        let result = '';
        for (let i = 0; i < length; i++) {
            let rnum = Math.floor(Math.random() * chars.length);
            result += chars.substring(rnum, rnum + 1);
        }
        return result;
    }
    
    /**
     * Generates a random password with uppercase, lowercase, and numbers
     * @param {number} length - Password length
     * @returns {string} Random password
     */
    randomPassword(length) {
        const thisInstance = this;

        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        
        if (!thisInstance.isNumber(length)) {
            length = 8;
        }

        let password = '';
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];

        const allChars = uppercase + lowercase + numbers;
        for (let i = 3; i < length; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
        }

        return password.split('').sort(() => Math.random() - 0.5).join('');
    }
    
    /**
     * Filters malicious code from input fields (XSS prevention)
     * @param {boolean} ignore_script_iframe - Whether to ignore script/iframe filtering
     */
    filterMaliciousCode(ignore_script_iframe = false) {
        const thisInstance = this;
        
        let dangerousPatterns = [
            /<script\b[^>]*>[\s\S]*?<\/script>/gi,
            /<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi,
            /<(input|textarea|select|form)\b[^>]*>[\s\S]*?<\/?(input|textarea|select|form)\b[^>]*>/gi,
            /\b((javascript|vbscript|wscript|jscript|vbs)\s*:\s*["\']?\s*\w+\s*\([^)]*\)\s*[,;]?["\']?)/gi,
            /\b((document|(document\.)?window)\.(location|on\w*))/gi,
            /\b(expression\s*\([^)]*\)\s*[,;]?)/gi,
            /\b(Redirect\s+30\d)/gi,
            /\b(on\w+\s*=\s*["\']?\s*\w+\s*\(.*\)\s*[,;]?["\']?)/gi
        ];
        if(thisInstance.isMatch(ignore_script_iframe, true)) {
            dangerousPatterns = [
                /<(input|textarea|select|form)\b[^>]*>[\s\S]*?<\/?(input|textarea|select|form)\b[^>]*>/gi,
                /\b((javascript|vbscript|wscript|jscript|vbs)\s*:\s*["\']?\s*\w+\s*\([^)]*\)\s*[,;]?["\']?)/gi,
                /\b((document|(document\.)?window)\.(location|on\w*))/gi,
                /\b(expression\s*\([^)]*\)\s*[,;]?)/gi,
                /\b(Redirect\s+30\d)/gi,
                /\b(on\w+\s*=\s*["\']?\s*\w+\s*\(.*\)\s*[,;]?["\']?)/gi
            ];
        }

        // filter function
        function filterInputValue(value) {
            let filtered = value;
            dangerousPatterns.forEach(pattern => {
                if (pattern.test(filtered)) {
                    filtered = filtered.replace(pattern, '');
                }
            });
            return filtered;
        }

        // use event delegation to listen to all input events
        document.addEventListener('input', function(event) {
            const target = event.target;

            // only handle input and textarea
            if (target.matches && (target.matches('input') || target.matches('textarea'))) {
                const original = target.value;
                const filtered = filterInputValue(original);

                if (filtered !== original) {
                    target.value = filtered;

                    // trigger input Event to ensure other listeners receive the update
                    target.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
        });
    }
    
    /**
     * Logs copyright and license information to console
     */
    copyright() {
        const startYear = 2023;
        const currentYear = new Date().getFullYear();
        const yearText = (startYear === currentYear) ? `${currentYear}` : `${startYear}–${currentYear}`;
        const author = 'KaiyunChan';
        const text = [
            'iWeby Kit - to easily build web applications with the most commonly used features already included.',
            'Copyright © ' + yearText+ ' ' + author,
            'License: Personal/educational use only. Modifications and commercial use require permission.',
        ];
        console.log(`%c${text.join('\n')}`, 'color: #525896; font-weight: bold;');
    }
}

/**
 * iMD5 - A self-contained MD5 hash implementation in JavaScript
 * 
 * This class implements the MD5 message-digest algorithm as defined in RFC 1321.
 * It processes input strings and produces a 32-character hexadecimal hash.
 * 
 * @example
 * const md5 = new iMD5();
 * const hash = md5.hash("Hello World");
 * console.log(hash); // "b10a8db164e0754105b7a99be72e3fe5"
 */
class iMD5 {
    constructor() {
        // Pre-computed hex character lookup table for efficient byte-to-hex conversion
        this.hexChr = '0123456789abcdef'.split('');
    }

    /**
     * Adds two 32-bit integers with overflow wrapping
     * @param {number} a - First 32-bit integer
     * @param {number} b - Second 32-bit integer
     * @returns {number} Result masked to 32 bits
     */
    add32(a, b) {
        return (a + b) & 0xFFFFFFFF;
    }

    /**
     * Core MD5 compression function operation
     * Combines rotation, addition, and bitwise operations
     * @param {number} q - Primary input value
     * @param {number} a - Buffer A
     * @param {number} b - Buffer B
     * @param {number} x - Data chunk
     * @param {number} s - Left rotation shift amount
     * @param {number} t - Addition constant (sine-based)
     * @returns {number} Computed 32-bit value
     */
    cmn(q, a, b, x, s, t) {
        return this.add32(
            (this.add32(this.add32(a, q), this.add32(x, t)) << s) | 
            (this.add32(this.add32(a, q), this.add32(x, t)) >>> (32 - s)), 
            b
        );
    }

    // --- MD5 Round Functions ---
    // Each round uses a different nonlinear function (FF, GG, HH, II)
    // These implement the four auxiliary functions defined in the MD5 specification

    /** Round 1 function: (b & c) | (~b & d) */
    ff(a, b, c, d, x, s, t) {
        return this.cmn((b & c) | ((~b) & d), a, b, x, s, t);
    }

    /** Round 2 function: (b & d) | (c & ~d) */
    gg(a, b, c, d, x, s, t) {
        return this.cmn((b & d) | (c & (~d)), a, b, x, s, t);
    }

    /** Round 3 function: b ^ c ^ d (XOR) */
    hh(a, b, c, d, x, s, t) {
        return this.cmn(b ^ c ^ d, a, b, x, s, t);
    }

    /** Round 4 function: c ^ (b | ~d) */
    ii(a, b, c, d, x, s, t) {
        return this.cmn(c ^ (b | (~d)), a, b, x, s, t);
    }

    /**
     * Processes a single 512-bit block (16-word chunk) through the MD5 compression
     * This is the heart of the MD5 algorithm - performs 64 operations per block
     * 
     * @param {number[]} x - State array [a, b, c, d] to be updated
     * @param {number[]} k - 16-word (512-bit) message block
     */
    md5cycle(x, k) {
        let a = x[0], b = x[1], c = x[2], d = x[3];

        // --- Round 1: 16 operations using FF function ---
        a = this.ff(a, b, c, d, k[0], 7, -680876936);
        d = this.ff(d, a, b, c, k[1], 12, -389564586);
        c = this.ff(c, d, a, b, k[2], 17, 606105819);
        b = this.ff(b, c, d, a, k[3], 22, -1044525330);
        a = this.ff(a, b, c, d, k[4], 7, -176418897);
        d = this.ff(d, a, b, c, k[5], 12, 1200080426);
        c = this.ff(c, d, a, b, k[6], 17, -1473231341);
        b = this.ff(b, c, d, a, k[7], 22, -45705983);
        a = this.ff(a, b, c, d, k[8], 7, 1770035416);
        d = this.ff(d, a, b, c, k[9], 12, -1958414417);
        c = this.ff(c, d, a, b, k[10], 17, -42063);
        b = this.ff(b, c, d, a, k[11], 22, -1990404162);
        a = this.ff(a, b, c, d, k[12], 7, 1804603682);
        d = this.ff(d, a, b, c, k[13], 12, -40341101);
        c = this.ff(c, d, a, b, k[14], 17, -1502002290);
        b = this.ff(b, c, d, a, k[15], 22, 1236535329);

        // --- Round 2: 16 operations using GG function ---
        a = this.gg(a, b, c, d, k[1], 5, -165796510);
        d = this.gg(d, a, b, c, k[6], 9, -1069501632);
        c = this.gg(c, d, a, b, k[11], 14, 643717713);
        b = this.gg(b, c, d, a, k[0], 20, -373897302);
        a = this.gg(a, b, c, d, k[5], 5, -701558691);
        d = this.gg(d, a, b, c, k[10], 9, 38016083);
        c = this.gg(c, d, a, b, k[15], 14, -660478335);
        b = this.gg(b, c, d, a, k[4], 20, -405537848);
        a = this.gg(a, b, c, d, k[9], 5, 568446438);
        d = this.gg(d, a, b, c, k[14], 9, -1019803690);
        c = this.gg(c, d, a, b, k[3], 14, -187363961);
        b = this.gg(b, c, d, a, k[8], 20, 1163531501);
        a = this.gg(a, b, c, d, k[13], 5, -1444681467);
        d = this.gg(d, a, b, c, k[2], 9, -51403784);
        c = this.gg(c, d, a, b, k[7], 14, 1735328473);
        b = this.gg(b, c, d, a, k[12], 20, -1926607734);

        // --- Round 3: 16 operations using HH function ---
        a = this.hh(a, b, c, d, k[5], 4, -378558);
        d = this.hh(d, a, b, c, k[8], 11, -2022574463);
        c = this.hh(c, d, a, b, k[11], 16, 1839030562);
        b = this.hh(b, c, d, a, k[14], 23, -35309556);
        a = this.hh(a, b, c, d, k[1], 4, -1530992060);
        d = this.hh(d, a, b, c, k[4], 11, 1272893353);
        c = this.hh(c, d, a, b, k[7], 16, -155497632);
        b = this.hh(b, c, d, a, k[10], 23, -1094730640);
        a = this.hh(a, b, c, d, k[13], 4, 681279174);
        d = this.hh(d, a, b, c, k[0], 11, -358537222);
        c = this.hh(c, d, a, b, k[3], 16, -722521979);
        b = this.hh(b, c, d, a, k[6], 23, 76029189);
        a = this.hh(a, b, c, d, k[9], 4, -640364487);
        d = this.hh(d, a, b, c, k[12], 11, -421815835);
        c = this.hh(c, d, a, b, k[15], 16, 530742520);
        b = this.hh(b, c, d, a, k[2], 23, -995338651);

        // --- Round 4: 16 operations using II function ---
        a = this.ii(a, b, c, d, k[0], 6, -198630844);
        d = this.ii(d, a, b, c, k[7], 10, 1126891415);
        c = this.ii(c, d, a, b, k[14], 15, -1416354905);
        b = this.ii(b, c, d, a, k[5], 21, -57434055);
        a = this.ii(a, b, c, d, k[12], 6, 1700485571);
        d = this.ii(d, a, b, c, k[3], 10, -1894986606);
        c = this.ii(c, d, a, b, k[10], 15, -1051523);
        b = this.ii(b, c, d, a, k[1], 21, -2054922799);
        a = this.ii(a, b, c, d, k[8], 6, 1873313359);
        d = this.ii(d, a, b, c, k[15], 10, -30611744);
        c = this.ii(c, d, a, b, k[6], 15, -1560198380);
        b = this.ii(b, c, d, a, k[13], 21, 1309151649);
        a = this.ii(a, b, c, d, k[4], 6, -145523070);
        d = this.ii(d, a, b, c, k[11], 10, -1120210379);
        c = this.ii(c, d, a, b, k[2], 15, 718787259);
        b = this.ii(b, c, d, a, k[9], 21, -343485551);

        // Add the results back to the state (modulo 2^32)
        x[0] = this.add32(a, x[0]);
        x[1] = this.add32(b, x[1]);
        x[2] = this.add32(c, x[2]);
        x[3] = this.add32(d, x[3]);
    }

    /**
     * Main MD5 processing function for string input
     * 
     * Steps:
     * 1. Initialize MD5 state with magic constants
     * 2. Process message in 512-bit (64-byte) chunks
     * 3. Pad the final chunk according to MD5 specification
     * 4. Append message length (in bits) as 64-bit integer
     * 5. Process the final chunk
     * 
     * @param {string} s - Input string to hash
     * @returns {number[]} Array of 4 32-bit integers representing the hash state
     */
    md51(s) {
        let n = s.length;
        // MD5 initial state (magic constants from RFC 1321)
        let state = [1732584193, -271733879, -1732584194, 271733878];
        let i;

        // Process complete 64-byte blocks
        for (i = 64; i <= s.length; i += 64) {
            this.md5cycle(state, this.md5blk(s.substring(i - 64, i)));
        }

        // Get the remaining partial block (< 64 bytes)
        s = s.substring(i - 64);

        // Create the 16-word (512-bit) padding block
        let tail = new Array(16).fill(0);
        for (i = 0; i < s.length; i++) {
            tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
        }
        // Append the '1' bit (0x80) as per padding specification
        tail[i >> 2] |= 0x80 << ((i % 4) << 3);

        // If the padding doesn't leave enough room for the length (64 bits),
        // process this block and create another one
        if (i > 55) {
            this.md5cycle(state, tail);
            tail = new Array(16).fill(0);
        }

        // Append the original message length in bits (as 64-bit little-endian)
        // Note: Only lower 32 bits are used (JavaScript number limitation)
        tail[14] = n * 8;

        // Process the final block
        this.md5cycle(state, tail);

        return state;
    }

    /**
     * Converts a 64-byte string into a 16-word array (little-endian)
     * Each word is formed from 4 bytes
     * 
     * @param {string} s - 64-byte string chunk
     * @returns {number[]} Array of 16 32-bit integers
     */
    md5blk(s) {
        let md5blks = [];
        for (let i = 0; i < 64; i += 4) {
            md5blks[i >> 2] = 
                s.charCodeAt(i) + 
                (s.charCodeAt(i + 1) << 8) + 
                (s.charCodeAt(i + 2) << 16) + 
                (s.charCodeAt(i + 3) << 24);
        }
        return md5blks;
    }

    /**
     * Converts a 32-bit integer to an 8-character hex string (little-endian)
     * Processes bytes in reverse order (LSB first)
     * 
     * @param {number} n - 32-bit integer
     * @returns {string} 8-character hex representation
     */
    rhex(n) {
        let s = '';
        for (let j = 0; j < 4; j++) {
            // Extract each byte (from least significant to most significant)
            s += this.hexChr[(n >> (j * 8 + 4)) & 0x0F] + 
                 this.hexChr[(n >> (j * 8)) & 0x0F];
        }
        return s;
    }

    /**
     * Converts the final hash state array to a 32-character hex string
     * 
     * @param {number[]} x - Array of 4 32-bit integers
     * @returns {string} Concatenated hex string
     */
    hex(x) {
        for (let i = 0; i < x.length; i++) {
            x[i] = this.rhex(x[i]);
        }
        return x.join('');
    }

    /**
     * Public API: Compute MD5 hash of a string
     * 
     * @param {string} s - Input string to hash
     * @returns {string} 32-character hexadecimal MD5 hash
     */
    hash(s) {
        return this.hex(this.md51(s));
    }
}

/**
 * iDatePicker - A lightweight, customizable date picker component
 * 
 * This class creates an interactive date picker that can be attached to input elements.
 * It supports multiple languages, date formats, date restrictions, and disabled dates.
 * 
 * @example
 * const datePicker = new iDatePicker('en', 'YYYY-MM-DD');
 * datePicker.render('.date-input');
 * 
 * // HTML attributes for configuration:
 * // data-min="2024-01-01" - Minimum selectable date
 * // data-max="2024-12-31" - Maximum selectable date
 * // data-disabled-date="2024-12-25,2024-12-26" - Specific disabled dates
 * // data-disabled-week="0,6" - Disabled weekdays (0=Sunday, 6=Saturday)
 */
class iDatePicker {
    /**
     * Creates a new date picker instance
     * @param {string} lang - Language for day names ('en' or 'zh')
     * @param {string} dateFormat - Date format ('YYYY-MM-DD' or 'DD/MM/YYYY')
     */
    constructor(lang = 'en', dateFormat = 'YYYY-MM-DD') {
        this.lang = lang;
        this.dateFormat = dateFormat;
        this.calendarElement;              // DOM element of the calendar popup
        this.currentDate = new Date();      // Currently displayed month/year
        this.selectedDate;                 // User-selected date
        this.minDate;                      // Minimum selectable date
        this.maxDate;                      // Maximum selectable date
        this.activeInputElement;           // Input element currently focused
        this.disabledDates = [];           // Specific dates that cannot be selected
        this.disabledWeekdays = [];        // Weekdays that cannot be selected (0=Sunday, 1=Monday, ...)

        // Global click listener to close calendar when clicking outside
        document.addEventListener('click', (e) => {
            if (this.calendarElement &&
                !e.target.closest('input.idatepicker') &&
                !e.target.closest('div.idatepicker-calendar') &&
                e.target.id !== 'idatepicker-prev-month' &&
                e.target.id !== 'idatepicker-next-month') {
                this.hideCalendar();
            } 
            else if (e.target.closest('input.idatepicker')) {
                this.onFocusInput(e.target);
            }
        });
    }

    /**
     * Attaches the date picker to input elements matching the selector
     * @param {string} elements - CSS selector for input elements
     */
    render(elements) {
        const inputElements = document.querySelectorAll(elements);
        if (inputElements) {
            inputElements.forEach((inputElement) => {
                if (!inputElement.classList.contains('idatepicker')) {
                    inputElement.type = 'text';
                    inputElement.classList.add('idatepicker');
                }
            });
        }
    }

    /**
     * Handles input focus event - shows calendar for the focused input
     * @param {HTMLInputElement} inputElement - The input element that received focus
     */
    onFocusInput(inputElement) {
        let inputValue = inputElement.value;
        
        // Parse the input value or use current date if invalid
        if (!(inputValue && this.isValidDateFormat(inputValue))) {
            inputValue = this.formatDate(new Date());
        }

        this.currentDate = this.parseDate(inputValue);
        this.selectedDate = new Date(this.currentDate);
        
        // Read configuration attributes from the input element
        const minAttr = inputElement.getAttribute('data-min');
        this.minDate = minAttr ? minAttr.trim() : null;

        const maxAttr = inputElement.getAttribute('data-max');
        this.maxDate = maxAttr ? maxAttr.trim() : null;
        
        const disabledDatesAttr = inputElement.getAttribute('data-disabled-date');
        this.disabledDates = disabledDatesAttr ? disabledDatesAttr.split(',').map(d => d.trim()) : [];

        const disabledWeekdaysAttr = inputElement.getAttribute('data-disabled-week');
        this.disabledWeekdays = disabledWeekdaysAttr ? disabledWeekdaysAttr.split(',').map(d => parseInt(d.trim())) : [];

        this.activeInputElement = inputElement;
        this.showCalendar(inputElement);
    }

    /**
     * Displays the calendar popup near the input element
     * @param {HTMLInputElement} inputElement - The input element to position the calendar near
     */
    showCalendar(inputElement) {
        // Remove existing calendar if present
        if (this.calendarElement) {
            this.calendarElement.remove();
        }

        // Create a new calendar container with styling
        this.calendarElement = this.createElement('div', {
            position: 'absolute',
            backgroundColor: '#fff',
            fontSize: '12px',
            padding: '8px',
            border: '2px solid #e6e6e6',
            borderRadius: '4px',
            boxSizing: 'border-box',
            marginTop: '2px',
            zIndex: '100'
        }, 'idatepicker-calendar');

        document.body.appendChild(this.calendarElement);

        // Position the calendar below the input element
        const rect = inputElement.getBoundingClientRect();
        this.calendarElement.style.top = (rect.bottom + window.scrollY) + 'px';
        this.calendarElement.style.left = (rect.left + window.scrollX) + 'px';

        this.buildCalendar();
    }

    /**
     * Removes the calendar popup from the DOM
     */
    hideCalendar() {
        if (this.calendarElement) {
            this.calendarElement.remove();
            this.calendarElement = null;
        }
    }

    /**
     * Builds the complete calendar UI with header and date grid
     */
    buildCalendar() {
        const currentYear = this.currentDate.getFullYear();
        const currentMonth = this.currentDate.getMonth();
        this.calendarElement.innerHTML = '';

        const headerDiv = this.createHeader();
        const table = this.createCalendarTable(currentYear, currentMonth);

        this.calendarElement.appendChild(headerDiv);
        this.calendarElement.appendChild(table);
    }

    /**
     * Creates the calendar header with month/year display and navigation buttons
     * @returns {HTMLElement} Header container element
     */
    createHeader() {
        const headerDiv = this.createElement('div', {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '5px 0px 10px 0px'
        });

        const prevButton = this.createButton('🞀', 'idatepicker-prev-month', () => this.changeMonth(-1));
        const monthYearSpan = this.createElement('span', {
            fontSize: '15px',
            fontWeight: 'bold'
        });
        monthYearSpan.textContent = this.currentDate.toLocaleString(this.lang === 'en' ? 'en' : 'zh', {
            month: 'short'
        }) + ' / ' + this.currentDate.getFullYear();

        const nextButton = this.createButton('🞂', 'idatepicker-next-month', () => this.changeMonth(1));

        headerDiv.appendChild(prevButton);
        headerDiv.appendChild(monthYearSpan);
        headerDiv.appendChild(nextButton);

        return headerDiv;
    }

    /**
     * Creates a styled button for month navigation
     * @param {string} text - Button text
     * @param {string} id - Button ID
     * @param {Function} onClick - Click event handler
     * @returns {HTMLButtonElement} The created button
     */
    createButton(text, id, onClick) {
        const button = this.createElement('button', {
            position: 'relative',
            backgroundColor: '#1da1f2',
            fontSize: '12px',
            color: '#fff',
            padding: '3px 6px',
            border: 'none',
            borderRadius: '3px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            boxSizing: 'border-box',
            cursor: 'pointer'
        });
        button.type = 'button';
        button.id = id;
        button.textContent = text;
        button.addEventListener('click', (e) => {
            e.preventDefault();
            onClick();
        });
        return button;
    }

    /**
     * Changes the displayed month by a delta value
     * @param {number} delta - Month offset (-1 for previous, 1 for next)
     */
    changeMonth(delta) {
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.buildCalendar();
    }

    /**
     * Creates the calendar table structure
     * @param {number} year - Year to display
     * @param {number} month - Month to display (0-11)
     * @returns {HTMLTableElement} The calendar table
     */
    createCalendarTable(year, month) {
        const table = this.createElement('table', {
            width: '100%',
            borderCollapse: 'collapse'
        });
        const thead = this.createTableHeader();
        const tbody = this.createTableBody(year, month);

        table.appendChild(thead);
        table.appendChild(tbody);
        return table;
    }

    /**
     * Creates the table header with day names
     * @returns {HTMLTableSectionElement} Header section
     */
    createTableHeader() {
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const days = (this.lang === 'en') ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] : ['日', '一', '二', '三', '四', '五', '六'];
        
        days.forEach((day) => {
            const th = this.createElement('th', {
                width: '36px',
                height: '28px',
                fontSize: '12px',
                color: '#1da1f2',
                padding: '4px',
                border: '2px solid #e6e6e6',
                boxSizing: 'border-box',
                textAlign: 'center'
            });
            th.textContent = day;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        return thead;
    }

    /**
     * Creates the table body with date cells for the specified month
     * @param {number} year - Year to display
     * @param {number} month - Month to display (0-11)
     * @returns {HTMLTableSectionElement} Body section
     */
    createTableBody(year, month) {
        const tbody = document.createElement('tbody');
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const prevMonthDays = new Date(year, month, 0).getDate();
        let startDay = prevMonthDays - firstDayOfMonth + 1;

        let day = 1;
        let nextMonthDay = 1;

        for (let rowIndex = 0; rowIndex < 6; rowIndex++) {
            const row = document.createElement('tr');

            for (let colIndex = 0; colIndex < 7; colIndex++) {
                let td;

                if (rowIndex === 0 && colIndex < firstDayOfMonth) {
                    // Display days from the previous month
                    const dateObj = this.formatDate(new Date(year, month - 1, startDay++));
                    td = this.createDateCell(startDay - 1, dateObj, true);
                } 
                else if (day > daysInMonth) {
                    // Display days from the next month
                    const dateObj = this.formatDate(new Date(year, month + 1, nextMonthDay));
                    td = this.createDateCell(nextMonthDay++, dateObj, true);
                } 
                else {
                    // Display days from the current month
                    const dateObj = this.formatDate(new Date(year, month, day));
                    td = this.createDateCell(day++, dateObj, false);
                }

                row.appendChild(td);
            }

            tbody.appendChild(row);
        }

        return tbody;
    }

    /**
     * Creates a date cell with styling and interaction
     * @param {number} day - Day number to display
     * @param {string} dateObj - Formatted date string
     * @param {boolean} isOtherMonth - Whether this date belongs to another month
     * @returns {HTMLTableCellElement} The created cell
     */
    createDateCell(day, dateObj, isOtherMonth) {
        let canSelect = true;
        let isHoliday = false;
        const dateObjParsed = this.parseDate(dateObj);
        
        // Check min/max date restrictions
        if(this.minDate !== null) {
            if(new Date(this.minDate) - new Date(dateObj) > 0) {
                canSelect = false;
            }
        }
        if(this.maxDate !== null) {
            if(new Date(this.maxDate) - new Date(dateObj) < 0) {
                canSelect = false;
            }
        }
        
        // Check specific disabled dates (supports wildcard patterns like "2024-12-*")
        if (this.disabledDates.length > 0) {
            const dateStr = this.formatDate(dateObjParsed);
            if (this.disabledDates.some(disabledDate => {
                if (disabledDate.includes('*')) {
                    const pattern = disabledDate.replace(/\*/g, '\\d+');
                    const regex = new RegExp('^' + pattern + '$');
                    return regex.test(dateStr);
                }
                return dateStr === disabledDate;
            })) {
                canSelect = false;
                isHoliday = true;
            }
        }

        // Check disabled weekdays
        if (this.disabledWeekdays.length > 0) {
            const weekday = dateObjParsed.getDay();
            if (this.disabledWeekdays.includes(weekday)) {
                canSelect = false;
                isHoliday = true;
            }
        }
        
        // Determine cell styling based on state (selected, disabled, other month)
        const td = this.createElement('td', {
            backgroundColor: (isHoliday ? '#f6f6f6' : this.selectedDate && dateObj === this.formatDate(this.selectedDate) ? '#1da1f2' : ''),
            width: '36px',
            height: '28px',
            fontSize: '12px',
            color: ((!canSelect || isOtherMonth)  ? (isHoliday ? '#f93a37' : '#aaa') : (this.selectedDate && dateObj === this.formatDate(this.selectedDate) ? '#fff' : '')),
            padding: '4px',
            border: '2px solid #e6e6e6',
            boxSizing: 'border-box',
            textAlign: 'center',
            cursor: 'pointer'
        });
        td.dataset.date = dateObj;
        td.textContent = day;
        
        if(canSelect) {
            td.addEventListener('click', () => this.onDateSelect(dateObj));
        }
        return td;
    }
    
    /**
     * Handles date selection - updates input and closes calendar
     * @param {string} dateObj - Formatted date string
     */
    onDateSelect(dateObj) {
        const selectedDate = this.parseDate(dateObj);
        if (!isNaN(selectedDate)) {
            this.activeInputElement.value = this.formatDate(selectedDate);
            this.activeInputElement.dispatchEvent(new Event('change', {
                bubbles: true
            }));
            this.selectedDate = selectedDate;
            this.buildCalendar();
            this.hideCalendar();
        }
    }

    /**
     * Utility method to create DOM elements with styles
     * @param {string} tag - HTML tag name
     * @param {Object} styles - CSS styles to apply
     * @param {string} className - Optional class name
     * @returns {HTMLElement} The created element
     */
    createElement(tag, styles = {}, className) {
        const el = document.createElement(tag);
        if (className) el.className = className;
        Object.assign(el.style, styles);
        return el;
    }

    /**
     * Validates if a date string matches the configured format
     * @param {string} dateString - Date string to validate
     * @returns {boolean} True if valid format
     */
    isValidDateFormat(dateString) {
        let regex;
        if ((this.dateFormat.toString().toUpperCase()) === 'DD/MM/YYYY') {
            regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
        } 
        else {
            regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
        }
        return regex.test(dateString);
    }

    /**
     * Parses a date string into a Date object based on the configured format
     * @param {string} dateString - Date string to parse
     * @returns {Date} Parsed date object
     */
    parseDate(dateString) {
        const [year, month, day] = (this.dateFormat.toString().toUpperCase()) === 'DD/MM/YYYY' ?
            dateString.split('/').map(Number).reverse() : 
            dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    /**
     * Formats a Date object into a string based on the configured format
     * @param {Date} date - Date object to format
     * @returns {string} Formatted date string
     */
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        if ((this.dateFormat.toString().toLowerCase()) === 'dd/mm/yyyy') {
            return day + '/' + month + '/' + year;
        }
        return year + '-' + month + '-' + day;
    }
}

/**
 * iTimePicker - A lightweight, customizable time picker component
 * 
 * This class creates an interactive time picker that can be attached to input elements.
 * It supports time ranges, intervals, and disabled time ranges.
 * 
 * @example
 * const timePicker = new iTimePicker();
 * timePicker.render('.time-input');
 * 
 * // HTML attributes for configuration:
 * // data-start="600" - Start time in HHMM format (e.g., 600 = 06:00)
 * // data-end="2200" - End time in HHMM format (e.g., 2200 = 22:00)
 * // data-interval="5" - Interval in minutes between time options
 * // data-disabled-range="09:00-12:00,13:30-14:30" - Disabled time ranges
 */
class iTimePicker {
    constructor() {
        this.activeInput = null;                    // Currently focused input element
        this.disabledTimeRanges = [];               // Array of disabled time ranges {start, end} in minutes
        this.pickerElement = null;                  // Reference to the picker DOM element
        
        // Global click listener to close picker when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('input.itimepicker') &&
                !e.target.closest('div.time-picker-list')) {
                this.hidePicker();
            } 
            else if (e.target.closest('input.itimepicker')) {
                this.showTimePicker(e.target);
                this.formatInputTime(e.target);
            }
        });
    }

    /**
     * Attaches the time picker to input elements matching the selector
     * @param {string} elements - CSS selector for input elements
     */
    render(elements) {
        const inputElements = document.querySelectorAll(elements);
        if (inputElements) {
            inputElements.forEach((inputElement) => {
                if (!inputElement.classList.contains('itimepicker')) {
                    inputElement.type = 'text';
                    inputElement.classList.add('itimepicker');
                    inputElement.placeholder = 'HH:MM';
                }
            });
        }
    }

    /**
     * Displays the time picker popup near the input element
     * @param {HTMLInputElement} input - The input element to position the picker near
     */
    showTimePicker(input) {
        this.hidePicker();

        this.activeInput = input;
        
        // Parse configuration attributes with fallback defaults
        const startTime = (parseInt(input.getAttribute('data-start') || 600));  // Default: 06:00
        const endTime = (parseInt(input.getAttribute('data-end') || 2200));     // Default: 22:00
        const interval = parseInt(input.getAttribute('data-interval') || 5);    // Default: 5 minutes
        
        // Parse disabled time ranges from data attribute
        const disabledRangesAttr = input.getAttribute('data-disabled-range');
        this.disabledTimeRanges = this.parseDisabledRanges(disabledRangesAttr);
        
        const picker = this.createPicker(startTime, endTime, interval);
        document.body.appendChild(picker);
        this.pickerElement = picker;

        // Position the picker below the input element
        const { top, left, height } = input.getBoundingClientRect();
        picker.style.position = 'absolute';
        picker.style.top = (top + window.scrollY + height) + 'px';
        picker.style.left = (left + window.scrollX) + 'px';
    }

    /**
     * Removes the time picker from the DOM
     */
    hidePicker() {
        if (this.pickerElement) {
            this.pickerElement.remove();
            this.pickerElement = null;
        }
        // Fallback: remove by selector if reference is lost
        const picker = document.querySelector('div.time-picker-list');
        if (picker) {
            picker.remove();
        }
    }

    /**
     * Creates the time picker dropdown with time options
     * @param {number} startTime - Start time in HHMM format (e.g., 600 = 06:00)
     * @param {number} endTime - End time in HHMM format (e.g., 2200 = 22:00)
     * @param {number} interval - Interval in minutes between options
     * @returns {HTMLElement} The picker container element
     */
    createPicker(startTime, endTime, interval) {
        const picker = document.createElement('div');
        picker.classList.add('time-picker-list');
        
        // Apply styling
        Object.assign(picker.style, {
            border: '2px solid #e6e6e6',
            backgroundColor: '#fff',
            padding: '10px',
            marginTop: '2px',
            maxHeight: '200px',
            overflow: 'auto',
            zIndex: '100',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        });

        const times = this.generateTimeOptions(startTime, endTime, interval);
        
        if (times.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.textContent = 'No time options available';
            emptyMsg.style.padding = '10px';
            emptyMsg.style.color = '#999';
            emptyMsg.style.textAlign = 'center';
            picker.appendChild(emptyMsg);
            return picker;
        }

        times.forEach(time => {
            const timeOption = document.createElement('div');
            timeOption.textContent = time;
            timeOption.classList.add('time-option');
            
            // Check if this time is within any disabled range
            const isDisabled = this.isTimeDisabled(time);
            
            // Apply styling based on disabled state
            Object.assign(timeOption.style, {
                padding: '8px 12px',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                borderBottom: '1px solid #f0f0f0',
                color: isDisabled ? '#aaa' : '#333',
                backgroundColor: isDisabled ? '#f5f5f5' : 'transparent',
                transition: 'background-color 0.15s ease'
            });

            // Hover effect for enabled options
            if (!isDisabled) {
                timeOption.addEventListener('mouseenter', () => {
                    timeOption.style.backgroundColor = '#e8f4fd';
                });
                timeOption.addEventListener('mouseleave', () => {
                    timeOption.style.backgroundColor = 'transparent';
                });
                
                timeOption.addEventListener('click', () => {
                    if (this.activeInput) {
                        this.activeInput.value = time;
                        this.activeInput.dispatchEvent(new Event('change', {
                            bubbles: true
                        }));
                        this.activeInput.dispatchEvent(new Event('input', {
                            bubbles: true
                        }));
                        this.hidePicker();
                    }
                });
            } else {
                // Add disabled indicator
                timeOption.title = 'This time is disabled';
            }
            
            picker.appendChild(timeOption);
        });

        return picker;
    }

    /**
     * Generates an array of time strings within the specified range and interval
     * @param {number} startTime - Start time in HHMM format
     * @param {number} endTime - End time in HHMM format
     * @param {number} interval - Interval in minutes between options
     * @returns {string[]} Array of formatted time strings (HH:MM)
     */
    generateTimeOptions(startTime, endTime, interval) {
        const times = [];
        const startHour = Math.floor(startTime / 100);
        const startMinute = startTime % 100;
        const endHour = Math.floor(endTime / 100);
        const endMinute = endTime % 100;

        // Validate input ranges
        if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) {
            console.warn('iTimePicker: Invalid time range - hours must be between 0-23');
            return times;
        }

        let currentHour = startHour;
        let currentMinute = startMinute;

        while (currentHour < endHour || (currentHour === endHour && currentMinute <= endMinute)) {
            if (currentHour < 24 && currentHour >= 0) {
                times.push(this.formatTime(currentHour, currentMinute));
            }
            currentMinute += interval;
            if (currentMinute >= 60) {
                currentMinute = 0;
                currentHour++;
            }
        }

        return times;
    }

    /**
     * Formats hour and minute into a time string (HH:MM)
     * @param {number} hour - Hour (0-23)
     * @param {number} minute - Minute (0-59)
     * @returns {string} Formatted time string
     */
    formatTime(hour, minute) {
        const formattedHour = String(hour).padStart(2, '0');
        const formattedMinute = String(minute).padStart(2, '0');
        return formattedHour + ':' + formattedMinute;
    }

    /**
     * Auto-formats input value as the user types (HHMM -> HH:MM)
     * @param {HTMLInputElement} input - The input element to format
     */
    formatInputTime(input) {
        const value = input.value.replace(/\D/g, ''); // Remove non-digit characters
        if (value.length > 4) return;

        if (value.length === 4) {
            const hour = parseInt(value.slice(0, 2));
            const minute = parseInt(value.slice(2, 4));
            
            // Validate hour and minute ranges
            if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
                input.value = this.formatTime(hour, minute);
            }
        }
    }

    /**
     * Parses disabled time ranges from a string attribute
     * Supports format: "09:00-12:00,13:30-14:30"
     * @param {string|null} disabledRangesAttr - The attribute string to parse
     * @returns {Array<{start: number, end: number}>} Array of ranges in minutes
     */
    parseDisabledRanges(disabledRangesAttr) {
        if (!disabledRangesAttr) return [];
        
        const ranges = [];
        const rangeStrings = disabledRangesAttr.split(',').map(s => s.trim());
        
        rangeStrings.forEach(rangeStr => {
            const parts = rangeStr.split('-');
            if (parts.length === 2) {
                const start = this.timeToMinutes(parts[0].trim());
                const end = this.timeToMinutes(parts[1].trim());
                if (start !== null && end !== null && start < end) {
                    ranges.push({ start, end });
                } else {
                    console.warn('iTimePicker: Invalid disabled range format:', rangeStr);
                }
            }
        });
        
        return ranges;
    }

    /**
     * Converts a time string (HH:MM) to total minutes since midnight
     * @param {string} timeStr - Time string in HH:MM format
     * @returns {number|null} Minutes since midnight, or null if invalid
     */
    timeToMinutes(timeStr) {
        const parts = timeStr.split(':');
        if (parts.length === 2) {
            const hour = parseInt(parts[0]);
            const minute = parseInt(parts[1]);
            if (!isNaN(hour) && !isNaN(minute) && 
                hour >= 0 && hour < 24 && 
                minute >= 0 && minute < 60) {
                return hour * 60 + minute;
            }
        }
        return null;
    }

    /**
     * Checks if a given time string is within any disabled range
     * @param {string} timeStr - Time string in HH:MM format
     * @returns {boolean} True if the time is disabled
     */
    isTimeDisabled(timeStr) {
        if (this.disabledTimeRanges.length === 0) return false;
        
        const timeMinutes = this.timeToMinutes(timeStr);
        if (timeMinutes === null) return false;
        
        // Check if time falls within any disabled range
        for (const range of this.disabledTimeRanges) {
            if (timeMinutes >= range.start && timeMinutes < range.end) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Gets the current value from the active input
     * @returns {string} The current time value
     */
    getValue() {
        return this.activeInput ? this.activeInput.value : '';
    }

    /**
     * Sets the value of the active input
     * @param {string} time - Time string in HH:MM format
     */
    setValue(time) {
        if (this.activeInput) {
            this.activeInput.value = time;
            this.activeInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }
}

/**
 * iPagination - A lightweight, customizable pagination component
 * 
 * This class creates an interactive pagination widget with multiple display modes,
 * page jumping, and URL parameter management.
 * 
 * @example
 * // Basic usage
 * const pagination = new iPagination(document.getElementById('pagination'), {
 *     mode: 1,        // Display mode: 1=simple arrows, 2=with first/last page numbers
 *     size: 5,        // Number of page links to display
 *     total: 10,      // Total number of pages
 *     placeholder: 'Go' // Placeholder text for jump input
 * });
 * 
 * // HTML data attributes override options:
 * // data-size="5" - Number of page links to display
 * // data-totalpage="10" - Total number of pages
 */
class iPagination {
    /**
     * Creates a new pagination instance
     * @param {HTMLElement} el - Container element for the pagination
     * @param {Object} options - Configuration options
     * @param {number} options.mode - Display mode: 1=simple arrows, 2=with first/last page numbers
     * @param {number} options.size - Number of page links to display
     * @param {number} options.total - Total number of pages
     * @param {string} options.placeHolder - Placeholder text for jump input
     */
    constructor(el, options) {
        // Merge default options with user-provided options
        this.options = Object.assign({
            mode: 1,
            size: 5,
            total: 1,
            placeHolder: ''
        }, options);

        this.currentPage = 1;
        this.url = new URL(window.location.href);
        this.searchParams = new URLSearchParams(this.url.search);
        
        // Extract current page from URL query parameter
        if (this.searchParams.has('page')) {
            this.currentPage = Math.max(parseInt(this.searchParams.get('page')), 1);
        }
        // Remove page parameter to build clean base URL
        this.searchParams.delete('page');
        this.baseUrl = this.url.origin + this.url.pathname + '?' + this.searchParams.toString();

        this.renderPagination(el);
    }

    /**
     * Generates a URL with the specified page number
     * @param {number} page - Page number to include in URL
     * @returns {string} Complete URL with page parameter
     */
    createPageUrl(page) {
        return (this.baseUrl + '&page=' + page).replace('?&', '?');
    }

    /**
     * Adds event listener for page jumping via input field
     * @param {HTMLInputElement} inputElement - Input element for page jumping
     */
    jumpToPage(inputElement) {
        inputElement.addEventListener('keypress', (e) => {
            if (e.which === 13) { // Enter key
                const maxPage = parseInt(inputElement.getAttribute('data-max'));
                let jumpToPage = Math.min(
                    Math.max(parseInt(inputElement.value) || 1, 1),
                    maxPage
                );
                window.location.href = this.createPageUrl(jumpToPage);
            }
        });
    }

    /**
     * Utility method to create DOM elements with optional class and content
     * @param {string} tag - HTML tag name
     * @param {string} className - CSS class name(s)
     * @param {string} content - Inner HTML content
     * @returns {HTMLElement} The created element
     */
    createPaginationElement(tag, className = '', content = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (content) element.innerHTML = content;
        return element;
    }

    /**
     * Renders the pagination component in the container element
     * @param {HTMLElement} element - Container element for pagination
     */
    renderPagination(element) {
        // Prevent duplicate rendering
        if (!element.querySelector('div.iweby-pagination')) {
            // Get configuration from data attributes or use options
            let pageSize = parseInt(element.getAttribute('data-size')) || this.options.size;
            let totalPage = parseInt(element.getAttribute('data-totalpage')) || this.options.total;

            // Clamp current page within valid range
            this.currentPage = Math.min(this.currentPage, totalPage);
            
            // Calculate page range to display
            let firstPage = 1;
            let prevPage = Math.max(this.currentPage - 1, firstPage);
            let nextPage = Math.min(this.currentPage + 1, totalPage);
            let lastPage = totalPage;
            let diffPageNum = Math.floor(pageSize / 2);
            let startPageNum = Math.max(this.currentPage - diffPageNum, firstPage);
            let endPageNum = Math.min(this.currentPage + diffPageNum, lastPage);

            // Adjust page range to ensure we display exactly 'pageSize' links when possible
            if (endPageNum - startPageNum + 1 < pageSize) {
                if (this.currentPage < firstPage + diffPageNum) {
                    endPageNum = Math.min(lastPage, startPageNum + pageSize - 1);
                } else {
                    startPageNum = Math.max(firstPage, endPageNum - pageSize + 1);
                }
            }

            // Only render if there are multiple pages
            if (totalPage > 1) {
                // Create pagination container
                const paginationContainer = this.createPaginationElement('div', 'iweby-pagination');
                const paginationList = this.createPaginationElement('ul');

                // --- First Page Link ---
                // Mode 2: Shows first page number with ellipsis if not near start
                // Mode 1: Shows double arrow icon
                const firstPageContent = this.options.mode === 2 && this.currentPage > diffPageNum 
                    ? '<span>' + firstPage + '..</span>' 
                    : '<i></i><i></i>';
                let firstPageLink = this.createPaginationElement('a', 'first', firstPageContent);
                firstPageLink.href = this.createPageUrl(firstPage);
                firstPageLink.title = 'First Page';
                // Disable if already on first page
                if (this.currentPage === firstPage) {
                    firstPageLink.classList.add('disabled');
                    firstPageLink.href = 'javascript:void(0);';
                }
                let firstLi = this.createPaginationElement('li');
                firstLi.appendChild(firstPageLink);
                paginationList.appendChild(firstLi);

                // --- Previous Page Link ---
                let prevPageLink = this.createPaginationElement('a', 'prev', '<i></i>');
                prevPageLink.href = this.createPageUrl(prevPage);
                prevPageLink.title = 'Previous Page';
                if (this.currentPage === firstPage) {
                    prevPageLink.classList.add('disabled');
                    prevPageLink.href = 'javascript:void(0);';
                }
                let prevLi = this.createPaginationElement('li');
                prevLi.appendChild(prevPageLink);
                paginationList.appendChild(prevLi);

                // --- Page Number Links ---
                for (let i = startPageNum; i <= endPageNum; i++) {
                    const isCurrent = i === this.currentPage;
                    let pageLink = this.createPaginationElement(
                        'a', 
                        'num' + (isCurrent ? ' current' : ''), 
                        '<span>' + i + '</span>'
                    );
                    pageLink.href = this.createPageUrl(i);
                    if (isCurrent) {
                        pageLink.href = 'javascript:void(0);';
                    }
                    let pageLi = this.createPaginationElement('li');
                    pageLi.appendChild(pageLink);
                    paginationList.appendChild(pageLi);
                }

                // --- Next Page Link ---
                let nextPageLink = this.createPaginationElement('a', 'next', '<i></i>');
                nextPageLink.href = this.createPageUrl(nextPage);
                nextPageLink.title = 'Next Page';
                if (this.currentPage === lastPage) {
                    nextPageLink.classList.add('disabled');
                    nextPageLink.href = 'javascript:void(0);';
                }
                let nextLi = this.createPaginationElement('li');
                nextLi.appendChild(nextPageLink);
                paginationList.appendChild(nextLi);

                // --- Last Page Link ---
                // Mode 2: Shows ellipsis with last page number if not near end
                // Mode 1: Shows double arrow icon
                const lastPageContent = this.options.mode === 2 && this.currentPage < totalPage - diffPageNum 
                    ? '<span>..' + lastPage + '</span>' 
                    : '<i></i><i></i>';
                let lastPageLink = this.createPaginationElement('a', 'last', lastPageContent);
                lastPageLink.href = this.createPageUrl(lastPage);
                lastPageLink.title = 'Last Page';
                if (this.currentPage === lastPage) {
                    lastPageLink.classList.add('disabled');
                    lastPageLink.href = 'javascript:void(0);';
                }
                let lastLi = this.createPaginationElement('li');
                lastLi.appendChild(lastPageLink);
                paginationList.appendChild(lastLi);

                // --- Jump to Page Input ---
                let inputLi = this.createPaginationElement('li');
                let jumpInput = this.createPaginationElement('input', 'jumpto_page');
                jumpInput.type = 'text';
                jumpInput.placeholder = this.options.placeHolder;
                jumpInput.setAttribute('data-max', totalPage);
                jumpInput.setAttribute('aria-label', 'Jump to page');
                this.jumpToPage(jumpInput);
                inputLi.appendChild(jumpInput);
                paginationList.appendChild(inputLi);

                // Append the list to the pagination container and the container to the element
                paginationContainer.appendChild(paginationList);
                element.appendChild(paginationContainer);
            }
        }
    }

    /**
     * Updates the pagination with new total pages without re-rendering from scratch
     * @param {number} newTotal - New total number of pages
     * @param {HTMLElement} element - Container element containing pagination
     */
    updateTotal(newTotal, element) {
        this.options.total = newTotal;
        // Remove existing pagination and re-render
        const existing = element.querySelector('.iweby-pagination');
        if (existing) {
            existing.remove();
        }
        this.renderPagination(element);
    }

    /**
     * Gets the current page number
     * @returns {number} Current page number
     */
    getCurrentPage() {
        return this.currentPage;
    }

    /**
     * Navigates to a specific page programmatically
     * @param {number} page - Page number to navigate to
     */
    goToPage(page) {
        const totalPage = this.options.total;
        const targetPage = Math.min(Math.max(page, 1), totalPage);
        if (targetPage !== this.currentPage) {
            window.location.href = this.createPageUrl(targetPage);
        }
    }
}

/**
 * iModalDialog - A lightweight, draggable, resizable modal dialog component
 * 
 * This class creates customizable modal dialogs with drag, resize, and maximize functionality.
 * It includes Font Awesome icons for action buttons and supports stacking order (z-index).
 * 
 * @example
 * // Basic usage
 * const modal = new iModalDialog('Hello World!', {
 *     title: 'My Modal',
 *     width: 400,
 *     height: 300,
 *     className: 'custom-modal',
 *     init: function() {
 *         console.log('Modal initialized');
 *     }
 * });
 * 
 * // Close programmatically
 * modal.close();
 * 
 * // With HTML content
 * const modal2 = new iModalDialog('<p>This is <strong>HTML</strong> content</p>', {
 *     title: 'HTML Content',
 *     width: 500,
 *     height: 400
 * });
 * 
 * // CSS requirements (in your stylesheet):
 * // .imodal-dialog { position: fixed; background: #fff; border-radius: 8px; 
 * //                  box-shadow: 0 10px 40px rgba(0,0,0,0.3); display: flex; 
 * //                  flex-direction: column; min-width: 200px; min-height: 150px; }
 * // .imodal-dialog .top { display: flex; justify-content: space-between; 
 * //                       align-items: center; padding: 12px 16px; 
 * //                       background: #f8f9fa; border-radius: 8px 8px 0 0; 
 * //                       cursor: move; user-select: none; }
 * // .imodal-dialog .content { flex: 1; padding: 16px; overflow: auto; }
 * // .imodal-dialog .resize-handle { width: 12px; height: 12px; 
 * //                                 position: absolute; bottom: 0; right: 0; 
 * //                                 cursor: nw-resize; }
 * // .imodal-dialog .resize-handle::after { content: ''; position: absolute; 
 * //                                        bottom: 3px; right: 3px; 
 * //                                        border-right: 6px solid #aaa; 
 * //                                        border-bottom: 6px solid #aaa; 
 * //                                        width: 10px; height: 10px; }
 * // .imodal-dialog .actions button { background: none; border: none; 
 * //                                  cursor: pointer; padding: 4px 8px; 
 * //                                  color: #666; font-size: 14px; }
 * // .imodal-dialog .actions button:hover { color: #333; }
 * // .imodal-dialog .actions .close:hover { color: #dc3545; }
 * // .imodal-dialog.current { z-index: 999; }
 */
class iModalDialog {
    /**
     * Creates a new modal dialog instance
     * @param {string} content - HTML content for the modal body
     * @param {Object} options - Configuration options
     * @param {string} options.title - Modal title (default: '')
     * @param {number} options.width - Modal width in pixels (default: 0 = auto)
     * @param {number} options.height - Modal height in pixels (default: 0 = auto)
     * @param {string} options.className - Additional CSS class for the modal (default: null)
     * @param {Function} options.init - Callback function executed after modal creation (default: null)
     */
    constructor(content = '', options) {
        this.options = Object.assign({
            title: '',
            width: 0,
            height: 0,
            className: null,
            init: null
        }, options);
        
        // State tracking
        this.isMaximized = false;
        this.normalState = { width: '', height: '', left: '', top: '' };
        
        this.createModal(content);
        this.makeDraggable();
        this.makeResizable();
        this.makeMaximizable();
    }

    /**
     * Creates and renders the modal DOM structure
     * @param {string} content - HTML content for the modal body
     */
    createModal(content) {
        // --- Create main modal container ---
        this.modal = document.createElement('div');
        this.modal.classList.add('imodal-dialog');
        if (this.options.className !== null) {
            this.modal.classList.add(this.options.className);
        }
        if (this.options.width > 0 && this.options.height > 0) {
            this.modal.style.width = this.options.width + 'px';
            this.modal.style.height = this.options.height + 'px';
        }
        
        // --- Create title bar ---
        const topBar = document.createElement('div');
        topBar.classList.add('top');

        // Title text
        const titleSpan = document.createElement('span');
        titleSpan.classList.add('title');
        titleSpan.textContent = this.options.title;

        // Actions container (buttons)
        const actionsDiv = document.createElement('div');
        actionsDiv.classList.add('actions');
        
        // Maximize/Fullscreen button
        const fullscreenBtn = document.createElement('button');
        fullscreenBtn.classList.add('fullscreen');
        fullscreenBtn.setAttribute('aria-label', 'Toggle fullscreen');
        const fullscreenIcon = document.createElement('i');
        fullscreenIcon.classList.add('fa', 'fa-clone');
        fullscreenBtn.appendChild(fullscreenIcon);

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.classList.add('close');
        closeBtn.setAttribute('aria-label', 'Close dialog');
        const closeIcon = document.createElement('i');
        closeIcon.classList.add('fa', 'fa-times');
        closeBtn.appendChild(closeIcon);

        actionsDiv.appendChild(fullscreenBtn);
        actionsDiv.appendChild(closeBtn);

        topBar.appendChild(titleSpan);
        topBar.appendChild(actionsDiv);

        // --- Create content body ---
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('content');
        contentDiv.innerHTML = content;

        // --- Create resize handle ---
        const resizeHandle = document.createElement('div');
        resizeHandle.classList.add('resize-handle');

        // --- Assemble modal ---
        this.modal.appendChild(topBar);
        this.modal.appendChild(contentDiv);
        this.modal.appendChild(resizeHandle);
        
        document.body.appendChild(this.modal);
        
        // Position modal with random offset from center for visual variety
        this.modal.style.left = ((document.documentElement.clientWidth - this.modal.offsetWidth) / 2) + (Math.random() * 100 - 50) + 'px';
        this.modal.style.top = ((document.documentElement.clientHeight - this.modal.offsetHeight) / 2) + (Math.random() * 100 - 50) + 'px';

        // --- Attach event listeners ---
        this.modal.querySelector('button.close').addEventListener('click', () => this.close());
        this.modal.querySelector('button.fullscreen').addEventListener('click', () => this.toggleMaximize());

        // Bring to front on click
        this.bringToFront();
        this.modal.addEventListener('mousedown', () => this.bringToFront());
        
        // Execute init callback if provided
        if (typeof this.options.init === 'function') {
            this.options.init();
        }
    }
    
    /**
     * Brings the modal to the front by setting the highest z-index
     * Also updates the 'current' class to indicate active modal
     */
    bringToFront() {
        let maxZ = 200;
        // Find the highest z-index among existing modals
        document.querySelectorAll('div.imodal-dialog').forEach((modal) => {
            modal.classList.remove('current');
            const zIndex = parseInt(window.getComputedStyle(modal).zIndex, 10);
            if (!isNaN(zIndex)) {
                maxZ = Math.max(maxZ, zIndex);
            }
        });
        // Set this modal on top
        this.modal.classList.add('current');
        this.modal.style.zIndex = maxZ + 1;
    }
    
    /**
     * Makes the modal draggable by dragging the title bar
     * Uses requestAnimationFrame for smooth rendering
     */
    makeDraggable() {
        let offsetX, offsetY, isDragging = false;

        this.modal.querySelector('div.top').addEventListener('mousedown', (e) => {
            isDragging = true;
            offsetX = e.clientX - this.modal.offsetLeft;
            offsetY = e.clientY - this.modal.offsetTop;
            this.bringToFront();
        });

        const onMouseMove = (e) => {
            if (!isDragging) return;
            // Calculate new position with boundaries
            let x = e.clientX - offsetX;
            let y = e.clientY - offsetY;
            x = Math.max(0, Math.min(x, document.documentElement.clientWidth - this.modal.offsetWidth));
            y = Math.max(0, Math.min(y, document.documentElement.clientHeight - this.modal.offsetHeight));

            requestAnimationFrame(() => {
                this.modal.style.left = x + 'px';
                this.modal.style.top = y + 'px';
            });
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', () => isDragging = false);
    }

    /**
     * Makes the modal resizable using the resize handle in the bottom-right corner
     * Maintains minimum dimensions of 200x150 pixels
     */
    makeResizable() {
        let isResizing = false, startX, startY, startWidth, startHeight;
        const handle = this.modal.querySelector('div.resize-handle');

        handle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = this.modal.offsetWidth;
            startHeight = this.modal.offsetHeight;
            this.bringToFront();
            e.preventDefault(); // Prevent text selection during resize
        });

        const onMouseMove = (e) => {
            if (!isResizing) return;
            // Calculate new dimensions with constraints
            let newWidth = startWidth + (e.clientX - startX);
            let newHeight = startHeight + (e.clientY - startY);
            newWidth = Math.max(200, Math.min(newWidth, document.documentElement.clientWidth - this.modal.offsetLeft));
            newHeight = Math.max(150, Math.min(newHeight, document.documentElement.clientHeight - this.modal.offsetTop));

            requestAnimationFrame(() => {
                this.modal.style.width = newWidth + 'px';
                this.modal.style.height = newHeight + 'px';
            });
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', () => isResizing = false);
    }

    /**
     * Adds maximize/restore functionality to the fullscreen button
     * Stores the normal state before maximizing for restoration
     */
    makeMaximizable() {
        this.isMaximized = false;
        this.normalState = { width: '', height: '', left: '', top: '' };

        this.toggleMaximize = () => {
            if (this.isMaximized) {
                // Restore to previous size and position
                this.modal.style.width = this.normalState.width;
                this.modal.style.height = this.normalState.height;
                this.modal.style.left = this.normalState.left;
                this.modal.style.top = this.normalState.top;
                // Update button icon
                const icon = this.modal.querySelector('button.fullscreen i');
                icon.className = 'fa fa-clone';
            } else {
                // Store current state before maximizing
                this.normalState = {
                    width: this.modal.style.width,
                    height: this.modal.style.height,
                    left: this.modal.style.left,
                    top: this.modal.style.top
                };
                // Maximize to viewport size
                this.modal.style.width = document.documentElement.clientWidth + 'px';
                this.modal.style.height = document.documentElement.clientHeight + 'px';
                this.modal.style.left = '0px';
                this.modal.style.top = '0px';
                // Update button icon
                const icon = this.modal.querySelector('button.fullscreen i');
                icon.className = 'fa fa-window-restore';
            }
            this.isMaximized = !this.isMaximized;
        };
    }

    /**
     * Closes and removes the modal from the DOM
     */
    close() {
        this.modal.remove();
    }

    /**
     * Updates the content of the modal
     * @param {string} newContent - New HTML content for the modal body
     */
    setContent(newContent) {
        const contentDiv = this.modal.querySelector('.content');
        if (contentDiv) {
            contentDiv.innerHTML = newContent;
        }
    }

    /**
     * Updates the title of the modal
     * @param {string} newTitle - New title text
     */
    setTitle(newTitle) {
        const titleSpan = this.modal.querySelector('.title');
        if (titleSpan) {
            titleSpan.textContent = newTitle;
        }
    }
}
