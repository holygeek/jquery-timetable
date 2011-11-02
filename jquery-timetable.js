/*jslint browser: true, node: true, continue: true */
(function( $, undefined ){
    "use strict";
    // TODO show subject start minute, duration on mouse over?
    // TODO complaint if adding book to a subject with an empty name?
    // TODO test.js: make others use selectPrev and selectNext too
    var _clearDiv = '<div class="clear"></div>',
        timetableWidth,
        timetableId,
        dayWidth = 70, // pixels
        days = [ 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday' ],
        editDialogIsVisible = 0,
        settings,
        pendingSlotBooksAction = {},
        thisIsANewSlot = 0,
        elementToEdit,
        clickedDays = [-1, -1],
        USE_HERE = true,
        DO_NOT_USE_HERE = false,
        dirtyBookList = 0, // Set to name of Subject when its book list shrinks
        _Monday = 0,
        _Sunday = 6,
        onSubject = false, // Item mouse hovered
        onTime = false,
        mostFrequentDuration,
        BOOK_DIFF_STAY = 'stay',
        BOOK_DIFF_ADD = 'in',
        BOOK_DIFF_REMOVE = 'out',
        renderedAt,
        currCompare = { prev: 0, next: 0 },
        currMouseOvered = '',
        KEY_ENTER = 13,
        KEY_ESC = 27,
        _createElement = function(type, id) {
            // This form is faster than $('<div>'). See
            // http://stackoverflow.com/questions/327047/what-is-the-most-efficient-way-to-create-html-elements-using-jquery
            var el = document.createElement(type);
            if (id) {
                el.id = id;
            }
            return el;
        },
        // FIXME Refactor this? Use dict h (for html), h = { tr: htmlGenerator('tr') }
        // may cause more typing: _div('foo') vs. h.div('foo')
        htmlGenerator = function(type) {
            return function(id) {
                return $(_createElement(type, id));
            };
        },
        _select = htmlGenerator('select'),
        _option = htmlGenerator('option'),
        _img = htmlGenerator('img'),
        _button = htmlGenerator('button'),
        _input = htmlGenerator('input'),
        _label = htmlGenerator('label'),
        _div = htmlGenerator('div'),
        _a = htmlGenerator('a'),
        _ol = htmlGenerator('ol'),
        _li = htmlGenerator('li'),
        _table = htmlGenerator('table'),
        _tr = htmlGenerator('tr'),
        _td = htmlGenerator('td'),
        _th = htmlGenerator('th'),
        _checkbox = function(id) {
                return _input(id).attr('type', 'checkbox');
        };

    function outerWidth(id) { return $('#'+id).outerWidth(); }
    function outerHeight(id) { return $('#'+id).outerHeight(); }
    function halfWidth(id) { return outerWidth(id) / 2; }
    function halfHeight(id) { return outerHeight(id) / 2; }
    function half(n) { return n / 2; }
    function x(id) { return $('#'+id).position().left; }
    function y(id) { return $('#'+id).position().top; }
    function putLeftOf(ref, box)
    {
        $('#'+box).css('left', x(ref) - outerWidth(box) + 'px');
        $('#'+box).css('top', y(ref) + 'px');
    }
    function putRightOf(ref, box)
    {
        $('#'+box).css('left', x(ref) + outerWidth(ref) + 'px');
        $('#'+box).css('top', y(ref) + 'px');
    }
    function putAbsRightOf(ref, box) {
        var offset,
            width;
        ref = $('#'+ref);
        offset = ref.offset();
        width = ref.outerWidth();
        $('#'+box).css({
            left: offset.left + width + 'px',
            top: offset.top
        });
    }
    function putAbsBottomOf(ref, box) {
        var width,
            refEl = $('#'+ref),
            offset = refEl.offset(),
            height = refEl.outerHeight()
        ;
        $('#'+box).css({
            left: offset.left + 'px',
            top: offset.top + height + 'px'
        });
    }
    function trimString(str) {
        return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    }
    function _foreach(array, dowhat, extras) {
        var i;
        extras = extras || {};
        for (i = 0; i < array.length; i++) {
            dowhat(array[i], extras.funargs || {}, i);
        }
        if(extras.epilogue) {
            extras.epilogue();
        }
    }
    function pad0(n) {
        if (n < 10) {
            return '0' + n;
        }
        return n;
    }
    function Time(hour, minute) {
        if (typeof hour === 'undefined') {
            hour = 0;
        }
        if (typeof minute === 'undefined') {
            minute = 0;
        }

        this.hour = hour;
        this.minute = minute;

        this.format = function () {
            return pad0(this.hour) + ':' + pad0(this.minute);
        };

        this.addMinutes = function(duration) {
            if (typeof duration === 'undefined') {
                throw 'addMinutes: duration must be given';
            }
            if (typeof duration !== 'number') {
                throw 'addMinutes: duration must be number';
            }

            this.minute += parseInt(duration, 10);
            while (this.minute >= 60) {
                this.minute -= 60;
                this.hour += 1;
                if (this.hour > 23) {
                    this.hour = 0;
                }
            }
            return this;
        };

        return this;
    }

    function registerBindingForClearance(idOrClass, eventName) {
        if (!settings.eventBindings[eventName]) {
            settings.eventBindings[eventName] = {};
        }
        settings.eventBindings[eventName][idOrClass] = 1;
    }

    function _intValue(str) {
        return parseInt(str, 10);
    }
    function slotExists(subject, slots) {
        var i;
        for(i = 0; i < slots.length; i++) {
            if (slots[i].s === subject) {
                return true;
            }
        }
        return false;
    }
    function hasBook(subject) {
        var bookname;
        // FIXME definition of hasbook:
        // 1. .nobook flag is not set AND
        // 2. subject.books exist AND
        // 2. books dict has at least one true entry
        if (typeof(subject.nobook) === 'undefined' || subject.nobook === false) {
            if (!subject.books) {
                // Book list is not specified, assume that it has books anyway
                return true;
            }
            for (bookname in subject.books) {
                if (subject.books.hasOwnProperty(bookname)) {
                    if (subject.books[bookname]) {
                        return true;
                    }
                }
            }
        }
        return ! subject.nobook;
    }
    function getNeededBooks(subject, list_of_subject) {
        var i,
            slot,
            bookname,
            neededBooks = {};

        for (i = 1; i < list_of_subject.length; i++) {
            slot = list_of_subject[i];
            if (slot.s === subject.s) {
                for (bookname in slot.books) {
                    if (slot.books.hasOwnProperty(bookname) && slot.books[bookname]) {
                        neededBooks[bookname] = true;
                    }
                }
            }
        }
        return neededBooks;
    }
    function compareSameSubjectBooks(subject, prev, next) {
        var hasBookToRemove,
            hasBookToAdd,
            bookname,
            prevBooksNeeded,
            nextBooksNeeded,
            bookDiff = {},
            result = false;

        prevBooksNeeded = getNeededBooks(subject, prev);
        nextBooksNeeded = getNeededBooks(subject, next);
        for (bookname in prevBooksNeeded) {
            if (prevBooksNeeded.hasOwnProperty(bookname)) {
                if (!nextBooksNeeded[bookname]) {
                    bookDiff[bookname] = BOOK_DIFF_REMOVE;
                    hasBookToRemove = true;
                } else {
                    bookDiff[bookname] = BOOK_DIFF_STAY;
                }
            }
        }
        for (bookname in nextBooksNeeded) {
            if (nextBooksNeeded.hasOwnProperty(bookname)) {
                if (!prevBooksNeeded[bookname]) {
                    hasBookToAdd = true;
                    bookDiff[bookname] = BOOK_DIFF_ADD;
                } else {
                    bookDiff[bookname] = BOOK_DIFF_STAY;
                }
            }
        }
        if (hasBookToRemove || hasBookToAdd) {
            result = bookDiff;
        }
        return result;
    }
    function getSubjectCssClassName(subject) {
        // FIXME replace invalid css characters to '-'
        if (subject.s) {
            return('s_' + subject.s.replace(/ /g, '_'));
        }
        return '';
    }
    function getSubjectBgColor(subject) {
        var className = getSubjectCssClassName(subject);
        if (className.length > 0) {
            return settings.schedule.bgColor[className] || 'white';
        }
        return 'white';
    }
    function _buildTakeInOutDiv(subject, extraclass) {
        var subjectname = subject.s;
        extraclass = extraclass || '';
        if (!subject || subjectname.match(/^ *$/)) {
            subjectname = '&nbsp;&nbsp;&nbsp;';
        }
        return [
            '<div class="',
            getSubjectCssClassName(subject),
            ' boxee ',
            extraclass,
            '"',
            'style="',
            'background-color: ',
            getSubjectBgColor(subject),
            ';"',
            '>',
            subjectname,
            '</div>'
        ].join('');
    }
    function addBookDiffEntry(subject, take, bookDiff) {
        var bookname,
            bookStatus,
            booksOut = {},
            booksIn = {},
            hasBookOut = false,
            hasBookIn = false;

        for (bookname in bookDiff) {
            if (bookDiff.hasOwnProperty(bookname)) {
                bookStatus = bookDiff[bookname];
                if (bookStatus === BOOK_DIFF_REMOVE) {
                    booksOut[bookname] = true;
                    hasBookOut = true;
                } else if (bookStatus === BOOK_DIFF_ADD) {
                    booksIn[bookname] = true;
                    hasBookIn = true;
                }
            }
        }
        if (hasBookOut) {
            take.out.text.push(_buildTakeInOutDiv(subject));
            take.out.subjects.push({ s: subject.s, books: booksOut });
        }
        if (hasBookIn) {
            take['in'].text.push(_buildTakeInOutDiv(subject));
            take['in'].subjects.push( { s: subject.s, books: booksIn  });
        }
    }
    function _getFulldayName(shortName) {
        var i;
        for (i = 0; i < days.length; i++) {
            if (shortName === days[i].substr(0, 2)) {
                return days[i];
            }
        }
    }
    function getBooksFor(subject) {
        var cssClass = getSubjectCssClassName(subject);
        var booksFor = settings.schedule.booksFor;
        if (!booksFor[cssClass]) {
            booksFor[cssClass] = [];
        }
        return  booksFor[cssClass];
    }
    function emptyTd() {
        return _td().html('&nbsp;');
    }
    function populateInOutBooksRow(tr, subject) {
        var j, bookname, allBooks, bookTd, hasBookListed = 0;
        tr.append(_td().append(_buildTakeInOutDiv(subject)));
        allBooks = getBooksFor(subject);
        if (allBooks.length) {
            bookTd = _td();
            for (j = 0; j < allBooks.length; j++) {
                bookname = allBooks[j];
                if (subject.books && subject.books[bookname]) {
                    bookTd.append(_div().html(bookname));
                    hasBookListed = 1;
                }
            }
            tr.append(bookTd);
        } else {
            tr.append(emptyTd());
        }
        return hasBookListed;
    }
    function populateInOutBooks(node, takein_subjects, takeout_subjects) {
        var table = _table(),
            putInHeader =_th().html('In').attr({'colspan': 2, 'id': 'bookInHeader'}),
            takeOutHeader = _th().html('Out').attr({'colspan': 2, 'id': 'bookOutHeader'}),
            i = 0, tr, j,
            ntakein = takein_subjects.length,
            ntakeout = takeout_subjects.length,
            books, subject,
            showBookTable
        ;

        table.append(_tr().append(putInHeader, takeOutHeader));
        table.append(
                _tr().append(
                    _th().html('Subject'),
                    _th().html('Book'),
                    _th().html('Subject'),
                    _th().html('Book')
                )
        );

        while (i < ntakein || i < ntakeout) {
            tr = _tr();
            if (i < ntakein) {
                if (populateInOutBooksRow(tr, takein_subjects[i])) {
                    showBookTable = 1;
                }
            } else {
                tr.append(emptyTd(), emptyTd());
            }
            if (i < ntakeout) {
                if(populateInOutBooksRow(tr, takeout_subjects[i])) {
                    showBookTable = 1;
                }
            } /* else {
                // No need to add here as the cells won't have flush left issue
            } */
            table.append(tr);
            i++;
        }

        if (showBookTable) {
            node.append(table);
            return 1; // To indicate that we are showing the table
        }
        return 0;
    }
    function showCompare(prev, next) {
        // FIXME camelCase
        var text,
            subject,
            takeout_subjects = [],
            takein_subjects = [],
            bookDiff,
            takein_text = [],
            takeout_text = [],
            subjects_stay = {},
            fullOutDayName,
            fullInDayName,
            tableShown,
            i;

        // take out
        for (i = 1; i < prev.length; i++) {
            subject = prev[i];
            subject.stay = slotExists(subject.s, next);
            if (hasBook(subject) && subject.stay === true) {
                subjects_stay[subject.s] = subject;
            }
        }
        // take in
        for(i = 1; i < next.length; i++) {
            subject = next[i];
            subject.take = !slotExists(subject.s, prev);
            if (hasBook(next[i]) && next[i].take === false) {
                subjects_stay[subject.s] = subject;
            }
        }
        // stay
        for (i in subjects_stay) {
            if (subjects_stay.hasOwnProperty(i)) {
                subject = subjects_stay[i];
                bookDiff = compareSameSubjectBooks(subject, prev, next);
                if (bookDiff) {
                    addBookDiffEntry(subject, {
                            'out' : {
                                subjects : takeout_subjects,
                                text : takeout_text
                            },
                            'in' : {
                                subjects : takein_subjects,
                                text : takein_text
                            }
                        },
                        bookDiff
                    );
                }
            }
        }

        // TODO Refactor the following similar code for take in and take out
        for (i = 1; i < prev.length; i++) {
            subject = prev[i];
            if (hasBook(subject) && subject.stay === false) {
                takeout_text.push(_buildTakeInOutDiv(subject));
                takeout_subjects.push(subject);
            }
        }
        fullOutDayName = _getFulldayName(prev[0].s);
        text = 'Take out from ' + fullOutDayName;
        $('#takeout').html('');
        $('#takeout').append(_div().attr('class', 'taketext').html(text));
        $('#takeout').append(takeout_text.join(''));

        for (i = 1; i < next.length; i++) {
            subject = next[i];
            if (hasBook(subject) && subject.take === true) {
                takein_text.push(_buildTakeInOutDiv(subject));
                takein_subjects.push(subject);
            }
        }
        fullInDayName = _getFulldayName(next[0].s);
        text = 'Put in for ' + fullInDayName;
        $('#takein').html('');
        $('#takein').append(_div().attr('class', 'taketext').html(text));
        $('#takein').append(takein_text.join(''));

        if ($('#inoutbook').size() === 0) {
            $('#inoutcontainer').append(_div('inoutbook'));
        } else {
            $('#inoutbook').html('');
        }
        tableShown = populateInOutBooks($('#inoutbook'), takein_subjects, takeout_subjects);
        if (tableShown) {
            $('#bookInHeader').html('In for ' + fullInDayName);
            $('#bookOutHeader').html('Out from ' + fullOutDayName);
        }
    }
    function rerender(opts) {
        var entry;
        if (opts) {
            for (entry in opts) {
                if (opts.hasOwnProperty(entry)) {
                    settings[entry] = opts[entry];
                }
            }
        }
        $('#editSubjectDialog').hide();
        renderedAt.timetable('render', false);
        showCompare(settings.schedule.internal[currCompare.prev], settings.schedule.internal[currCompare.next]);
    }
    function updateStartTime(hour_or_minute) {
            var newValue,
                time = settings.schedule.time;
            if (hour_or_minute === 'hour') {
                newValue = _intValue($('#startHour').val());
                if (isNaN(newValue)) {
                    return;
                }
                if (time.start.hour === newValue) {
                    return;
                }
                time.start.hour = newValue;
            }
            if (hour_or_minute === 'minute') {
                newValue = _intValue($('#startMinute').val());
                if (isNaN(newValue)) {
                    return;
                }
                if (time.start.minute === newValue) {
                    return;
                }
                time.start.minute = newValue;
            }
            rerender();
    }
    function _updateStartHour() {
      updateStartTime('hour');
    }
    function _updateStartMinute() {
      updateStartTime('minute');
    }
    function updateScale(evt) {
        settings.schedule.pixel_per_minute = $(this).val();
        rerender();
    }
    function _buildDayTimeScaleWidget(containerId) {
        var dayTimeScale = _div('dayTimeScale').attr('class','editWidget'),
            daySelect = _select('startDay'),
            hourSelect,
            minuteSelect,
            value,
            major = 1,
            minor = 0,
            scaleSelect,
            i;
        dayTimeScale.append(_label().html('Start day:'));
        for (i = 0; i < days.length; i++) {
            daySelect.append(_option().val(days[i]).html(days[i]));
        }
        dayTimeScale.append(daySelect);

        dayTimeScale.append(_label().html('Start time:'));
        hourSelect = _select('startHour').bind('change', _updateStartHour);
        hourSelect.append(_option().val('Hour').html('HH'));
        for(i = 0; i < 24; i++) {
          hourSelect.append(_option().val(i).html(pad0(i)));
        }
        dayTimeScale.append(hourSelect);

        minuteSelect = _select('startMinute').bind('change', _updateStartMinute);
        minuteSelect.append(_option().val('Minute').html('MM'));
        for(i = 0; i < 60; i += 5) {
          value = pad0(i);
          minuteSelect.append(_option().val(value).html(value));
        }
        dayTimeScale.append(minuteSelect);

        dayTimeScale.append(_label().html('Scale:'));
        scaleSelect = _select('scaleSelect').bind('change', updateScale);
        for(i = 1; i < 42; i++) {
            value = major + '.' + minor;
            scaleSelect.append(_option().val(value).html(value));
            minor += 1;
            if (minor >= 10) {
                minor = 0;
                major += 1;
            }
        }
        dayTimeScale.append(scaleSelect);
        dayTimeScale.append(_label().html('pixels per minute'));

        $(containerId).append(dayTimeScale);
        /*
        <div class="editWidget" id="dayTimeScale">
          <label>Start time: </label>
          <select id="startHour" onchange="schedule.updateStartTime('hour')">
            <option value="Hour">HH</option>
            <% FOREACH value IN [0..23] %>
            <option value="<% value %>"><% value FILTER format('%02d') %></option>
            <% END %>
          </select>
          <select id="startMinute" onchange="schedule.updateStartTime('minute')">
            <option value="Minute">MM</option>
            <% value = 0 %>
            <% WHILE(value != 60) %>
            <% v = value FILTER format('%02d') %>
            <option value="<% v %>"><% v %></option>
            <% value = value + 5 %>
            <% END %>
          </select>
        </div>
        */
    }
    function getMostFrequestDuration(durations) {
        var freq = {},
            maxFreq = 0,
            mostFrequentDurationHere = durations[0],
            i;
        for(i = 0; i < durations.length; i++) {
            if (freq[durations[i]]) {
                freq[durations[i]] += 1;
                if (freq[durations[i]] > maxFreq) {
                    maxFreq = freq[durations[i]];
                    mostFrequentDurationHere = durations[i];
                }
            } else {
                freq[durations[i]] = 1;
            }
        }
        return mostFrequentDurationHere;
    }
    function durationToSize(duration, noScale) {
        var size;
        if (noScale) {
            size = duration;
        } else {
            size = Math.round(duration * settings.schedule.pixel_per_minute);
        }
        /* Minus the two 1px left and right borders */
        return size - 2;
    }
    function renderTime(time, html) {
        var hour = time.start.hour,
            minute = time.start.minute,
            list_of_durations = time.durations,
            totalWidth = 0, width,
            clock,
            noScale = 1,
            duration,
            id,
            start_time,
            end_time,
            i;

        mostFrequentDuration = getMostFrequestDuration(list_of_durations);

        width = durationToSize(time.offset, noScale);
        totalWidth += width + 2;
        html.push('<div style="float:left;width: ',
                width,
                'px; border: 1px solid white;">&nbsp;</div>');

        clock = new Time(hour, minute);
        for(i = 0; i < list_of_durations.length; i++) {
            duration = list_of_durations[i];
            id = 'time' + i;
            start_time = clock.format();
            end_time = clock.addMinutes(duration).format();
            width = durationToSize(duration);
            totalWidth += width + 2; // add 2 px border for each time
            html.push(
                _div().append(_div(id).attr('class', 'time')
                        .css('width', width + 'px')
                        .html(start_time + '<br>' + end_time)).html()
            );
        }
        if (settings.edit) {
            html.push('<div id="adddurationc">');
            html.push('<input id="newduration" type="text" size="3"');
            html.push(' value="', mostFrequentDuration, '"');
            html.push(' maxlength="3">Minutes<br>');
            html.push('<button id="addduration">Add</button>');
            html.push('</div>');
            totalWidth += 120; // estimate of the #adddurationc width;
        }
        html.push(_clearDiv);
        return totalWidth;
    }
    function renderSlot(slot, funargs, idx) {
        var html = funargs.html,
            noScale = (slot.c && slot.c === 'day'),
            width = durationToSize(slot.d, noScale),
            style = [
                    'style="',
                    'width: ', width, 'px;',
                    'background-color: ', getSubjectBgColor(slot), ';',
                    '"'
                ].join(''),
            klass = slot.c || '',
            subjectCssClassName = getSubjectCssClassName(slot),
            id = 'j' + funargs.row + '_' + idx,
            div,
            extraclass = 'subjectslot ';

        if (klass === 'day') {
            extraclass = '';
        }
        // FIXME use join instead of +:
        div = ['<div ',
                    'id="' + id + '" ',
                    'class="',
                    extraclass,
                    'slot ',
                    klass,
                    ' ',
                    subjectCssClassName,
                    '" ',
                    style,
                    '>',
                    slot.s,
                    '</div>' ].join('');
        html.push(div);
    }
    function renderDaily(dailySchedule, funargs, idx) {
        var html = funargs.html;
        _foreach(dailySchedule, renderSlot, {
                    funargs: {
                                row : idx,
                                html: html
                            },
                    epilogue: function() {html.push(_clearDiv);}
                }
        );
    }
    function _getFirstDay() {
        return settings.schedule.internal[0][0].s;
    }
    function _shiftStartDayBackward() {
        settings.schedule.internal.push(settings.schedule.internal.shift());
    }
    function shiftUntil(shortDayName) {
        while (shortDayName !== _getFirstDay()) {
            _shiftStartDayBackward();
        }
    }
    function hasTwoDaysSelected() {
        return clickedDays[0] !== -1 && clickedDays[1] !== -1;
    }
    function _clearHighlight(klass) {
        $('.'+klass).removeClass('selected');
    }
    function _highlight(el) {
        $(el).addClass('selected');
    }
    function setCompare(row, day, clicked, klass) {
        clickedDays[row] = day;
        if (hasTwoDaysSelected()) {
            currCompare = { prev: clickedDays[0], next: clickedDays[1] };
            showCompare(settings.schedule.internal[clickedDays[0]], settings.schedule.internal[clickedDays[1]]);
        }
        _clearHighlight(klass);
        _highlight(clicked);
    }
    function updatePrevNextButtonText(startDayName, prevDaySelected, nextDaySelected) {
        var dayIndex = 0,
            i;

        while (days[dayIndex] !== startDayName) {
            dayIndex++;
        }
        for (i = 0; i < 7; i ++) {
            $('#t' + i).html(days[dayIndex]);
            $('#b' + i).html(days[dayIndex]);
            if (prevDaySelected === days[dayIndex]) {
                setCompare(0, i, '#t' + i, 'dayBoxTop');
            }
            if (nextDaySelected === days[dayIndex]) {
                setCompare(1, i, '#b' + i, 'dayBoxBottom');
            }
            dayIndex++;
            if (dayIndex > 6) {
                dayIndex = 0;
            }
        }
    }
    function changeStartDay() {
        var newStartDay = $('#startDay').val(),
            shortDayName = newStartDay.substr(0, 2),
            prevDaySelected = $('#compareContainer1 button.selected'),
            nextDaySelected = $('#compareContainer2 button.selected');

        if (prevDaySelected.size() === 1) {
            prevDaySelected = prevDaySelected.html();
        } else {
            prevDaySelected = undefined;
        }
        if (nextDaySelected.size() === 1) {
            nextDaySelected = nextDaySelected.html();
        } else {
            nextDaySelected = undefined;
        }

        shiftUntil(shortDayName);
        rerender();
        updatePrevNextButtonText(newStartDay, prevDaySelected, nextDaySelected);
    }
    function clearAllEventBindings() {
        var eventName, classOrId,
            eventBindings = settings.eventBindings,
            eventsFor;
        for (eventName in eventBindings) {
            if (eventBindings.hasOwnProperty(eventName)) {
                eventsFor = settings.eventBindings[eventName];
                for (classOrId in eventsFor) {
                    if (eventsFor.hasOwnProperty(classOrId)) {
                        $(classOrId).unbind(eventName);
                    }
                }
            }
        }
    }
    function hideEdit() {
        $('#editOption').hide();
    }
    function _maybeHideEdit(e) {
        var relTarg,
            hide;

        if (!e) {
            e = window.event;
        }
        relTarg = e.relatedTarget || e.toElement;
        hide = true;
        if ($(relTarg).hasClass('.subjectslot')) {
            hide = false;
        }
        if($(relTarg).attr('id') === 'editOption') {
            hide = false;
        }
        if ($(relTarg).parent().attr('id') === 'editOption') {
            hide = false;
        }
        if (hide) {
            hideEdit();
        }
    }
    function _getSelectedSubjectIndex(el) {
        var rowidx = $(el).attr('id').substr(1).split('_');
        return {
            row : parseInt(rowidx[0], 10),
            idx : parseInt(rowidx[1], 10)
        };
    }
    function _getSelectedTimeIndex(el) {
        var timeIdx = $(el).attr('id').replace('time', '');
        return { idx : parseInt(timeIdx, 10) };
    }
    function getSelectedIndex(el) {
        if (onSubject) {
            return _getSelectedSubjectIndex(el||currMouseOvered);
        } else if (onTime) {
            return _getSelectedTimeIndex(el||currMouseOvered);
        }
    }
    function showEdit() {
        var time,
            x,
            y,
            width,
            height,
            i,
            firstSlot,
            lastSlot;

        if (editDialogIsVisible) {
            return;
        }
        time = settings.schedule.time;
        x = $(this).position().left;
        y = $(this).position().top;
        width = $(this).outerWidth();
        height = $(this).outerHeight();
        currMouseOvered = this;
        onSubject = true;
        onTime = false;
        if (currMouseOvered.id.match('^time')) {
            onSubject = false;
            onTime = true;
        }

        $('#editOption').show();
        $('#editOption button').show();
        $('#editSubject').css('left', x + half(width) - halfWidth('editSubject') + 'px');
        $('#editSubject').css('top', y + height * 0.8 + 'px');

        $('#removeSlot').css('top', y - halfWidth('removeSlot') + 'px');
        $('#removeSlot').css('left', x + half(width) - halfWidth('removeSlot') + 'px');

        $('#insertBefore').css('left', x - halfWidth('insertBefore') + 'px');
        $('#insertBefore').css('top', y + half(height) - halfHeight('insertBefore') + 'px');

        $('#insertAfter').css('left', x + width - halfWidth('insertAfter') + 'px');
        $('#insertAfter').css('top', y + half(height) - halfHeight('insertAfter') + 'px');

        if ($(currMouseOvered).hasClass('day')) {
            $('#editSubject').hide();
            $('#removeSlot').hide();
            $('#insertBefore').hide();
            $('#moveLeft').hide();
            $('#moveRight').hide();
            return;
        }

        i = getSelectedIndex(currMouseOvered);
        if (onSubject) {
            firstSlot = i.idx === 1;
            lastSlot = i.idx === settings.schedule.internal[i.row].length - 1;
        } else if (onTime) {
            firstSlot = i.idx === 0;
            lastSlot = i.idx === settings.schedule.time.durations.length - 1;
        }

        if (firstSlot) {
            $('#moveLeft').hide();
        } else {
            putLeftOf('removeSlot', 'moveLeft');
        }
        if (lastSlot) {
            $('#moveRight').hide();
        } else {
            putRightOf('removeSlot', 'moveRight');
        }
        if (onTime && settings.schedule.time.durations.length === 1) {
            $('#removeSlot').hide();
        }
    }
    function setButtonEnabled(button, enabled) {
        $(button).attr('disabled', !enabled);
    }
    function getId(row, idx) {
        return '#j' + row + '_' + idx;
    }
    function removeSubject(target) {
        var rowidx,
            row,
            idx,
            id
        ;
        // FIXME Get rid of this if? run test to ensure it is safe
        if (! currMouseOvered) {
            return;
        }

        rowidx = getSelectedIndex(target);
        row = rowidx.row;
        idx = rowidx.idx;
        settings.schedule.internal[row].splice(idx, 1);
        hideEdit();
        id = getId(row, idx);
        $(id).hide('fast');
        rerender();
    }
    function removeTime(target) {
        var i,
            idx
        ;
        // FIXME Get rid of this if? run test to ensure it is safe
        if (! currMouseOvered) {
            return;
        }
        if (settings.schedule.time.durations.length === 1) {
            return;
        }
        i = getSelectedIndex(target);
        idx = i.idx;
        settings.schedule.time.durations.splice(idx, 1);
        hideEdit();
        $(currMouseOvered).hide('fast');
        rerender();
    }
    function removeSlot(evt, elementToRemove) {
        var slotToRemove = elementToRemove || currMouseOvered;
        if (onSubject) {
            return removeSubject(slotToRemove);
        } else if (onTime) {
            return removeTime(slotToRemove);
        }
    }
    function hideEditSubjectDialog(evt, fromOKButton) {
        var doAfterHideDialog;
        setButtonEnabled('#addduration', true);
        editDialogIsVisible = 0;
        doAfterHideDialog = function() {
            if (thisIsANewSlot && fromOKButton !== 'yes') {
                removeSlot(null, elementToEdit);
            }
            rerender();
        };
        $('#editSubjectDialog').hide('fast', doAfterHideDialog);
    }
    function hideEditTimeDialog() {
        setButtonEnabled('#addduration', true);
        editDialogIsVisible = 0;
        $('#editTimeDialog').hide('fast', function() { rerender(); });
    }
    function replaceUnsaveChars(str) {
        // TODO use jqencoder - http://software.digital-ritual.net/jqencoder/
        return str.replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  ;
    }
    function setSubjectBgColor(subject, color) {
        var subjectCssClassName = getSubjectCssClassName(subject);
        if (subjectCssClassName.length > 0) {
            settings.schedule.bgColor[subjectCssClassName] = color;
        }
    }
    function esdOK() {
        var i,
            dayRow,
            newSubject,
            subjectBgColor,
            oldSubject,
            id,
            oldCssClassName,
            newCssClassName,
            fromOKButton
        ;
        setButtonEnabled('#addduration', true);
        editDialogIsVisible = 0;
        i = getSelectedIndex(elementToEdit);
        dayRow = settings.schedule.internal[i.row];
        newSubject= {
            s: replaceUnsaveChars($('#newSubject').val()),
            d: replaceUnsaveChars($('#newDuration').val()),
            nobook: $('#nobooks').is(':checked'),
            books: dayRow[i.idx].books
        };
        subjectBgColor = $('#subjectBgColor').val();
        setSubjectBgColor(newSubject, subjectBgColor);
        oldSubject = dayRow[i.idx];
        dayRow[i.idx] = newSubject;
        id = getId(i.row, i.idx);
        $(id).html(newSubject.s);
        oldCssClassName = getSubjectCssClassName(oldSubject);
        newCssClassName = getSubjectCssClassName(newSubject);
        $(id)
            .css('width', durationToSize(newSubject.d) + 'px')
            .removeClass(oldCssClassName)
            .addClass(newCssClassName)
            ;
        $(id).css('background-color', getSubjectBgColor(newSubject));
        fromOKButton = 'yes';
        hideEditSubjectDialog(null, fromOKButton);
    }
    function etdOK() {
        var newTimeDuration,
            i
        ;
        setButtonEnabled('#addduration', true);
        newTimeDuration = replaceUnsaveChars($('#newTimeDuration').val());
        if (newTimeDuration.match(/[0-9]+/)) {
            newTimeDuration = parseInt(newTimeDuration, 10);
        } else {
            alert("Duration must be in minutes");
            return;
        }
        i = getSelectedIndex(elementToEdit);
        settings.schedule.time.durations[i.idx] = newTimeDuration;
        mostFrequentDuration = getMostFrequestDuration(settings.schedule.time.durations);
        hideEditTimeDialog();
    }
    function esdKeyUp(e) {
        var subject,
            subjectBgColor;

        // console.log('keycode: ' + e.keyCode);
        // console.log('KEY_ESC: ' + KEY_ESC);
        if (e.keyCode === KEY_ESC) {
            // FIXME figure out why hitting ESC does not come here
            if (onSubject) {
                hideEditSubjectDialog();
            } else if (onTime) {
                hideEditTimeDialog();
            }
            return;
        }
        if (e.keyCode === KEY_ENTER) {
            if (onSubject) {
                esdOK();
            } else if (onTime) {
                etdOK();
            }
            return;
        }
        if (onSubject) {
            subject = replaceUnsaveChars($('#newSubject').val());
            if (subject.length === 0 || subject.match(/^ *$/)) {
                $('#nobooks').attr("checked", true);
                $(elementToEdit).html('');
            } else {
                $('#nobooks').attr("checked", false);
                subjectBgColor = getSubjectBgColor({ s: subject });
                $('#icp_subjectBgColor').css('background-color', subjectBgColor);
                $(elementToEdit).css('background-color', subjectBgColor);
                $('#subjectBgColor').val(subjectBgColor);
                $(elementToEdit).html(replaceUnsaveChars(subject));
            }
            return;
        }
    }
    function animateSlotSize(e) {
        var text,
            width;
        if ($(elementToEdit).attr('id').match(/^j/)) {
            text = $('#newDuration').val();
        } else {
            text = $('#newTimeDuration').val();
        }
        if (!text.match(/^ *[0-9]+ */)) {
            return;
        }
        text = parseInt(text, 10);
        width = durationToSize(text);
        $('#' + timetableId).css('width', timetableWidth + width + 'px');
        $(elementToEdit).animate({width: width + 'px'});
    }
    function updateSubjectBagroundColor(evt) {
        var subject = $(elementToEdit).html(),
            klass = getSubjectCssClassName({ s:subject });

        $('.' + klass).css('background-color', $(this).val());
        $(elementToEdit).css('background-color', $(this).val());
    }
    function enableEditMode() {

        var time = settings.schedule.time,
            newValue;

        $('#editOption').mouseout(_maybeHideEdit);
        registerBindingForClearance('#editOption', 'mouseout');

        $('#startDay').change(changeStartDay);
        registerBindingForClearance('#startDay', 'change');

        $('.time').mouseover(showEdit);
        registerBindingForClearance('.time', 'mouseover');
        $('.time').mouseout(_maybeHideEdit);
        registerBindingForClearance('.time', 'mouseout');
        $('.time').mouseover(function(){$(this).css('cursor', 'pointer');});
        registerBindingForClearance('.time', 'mouseover');
        $('.subjectslot').mouseover(showEdit);
        registerBindingForClearance('.subjectslot', 'mouseover');
        $('.subjectslot').mouseout(_maybeHideEdit);
        registerBindingForClearance('.subjectslot', 'mouseout');
        $('#dayTimeScale').show();
        $('.subjectslot').mouseover(function(){$(this).css('cursor', 'pointer');});
        registerBindingForClearance('.subjectslot', 'mouseover');

        $('#startDay').val(_getFulldayName(_getFirstDay()));
        $('#startHour').val(time.start.hour);
        $('#startMinute').val(pad0(time.start.minute));
        $('#scaleSelect').val(settings.schedule.pixel_per_minute.toString());
        $('.slot').css('height','30px');
        $('.slot').css('padding-top','10px');
        $('.time').css('height','35px');
        $('.time').css('padding-top','10px');

        $('#newSubject').keyup(esdKeyUp);
        registerBindingForClearance('#newSubject', 'keyup');
        $('#newDuration').keyup(esdKeyUp);
        registerBindingForClearance('#newDuration', 'keyup');
        $('#newDuration').keyup(animateSlotSize);
        registerBindingForClearance('#newDuration', 'keyup');

        $('.day').mouseover(showEdit);
        registerBindingForClearance('.day', 'mouseover');
        $('.day').mouseout(_maybeHideEdit);
        registerBindingForClearance('.day', 'mouseout');
        $('.day').mouseover(function(){$(this).css('cursor', 'pointer');});
        registerBindingForClearance('.day', 'mouseover');

        $('button#addduration').bind('click', function() {
            newValue = _intValue($('#newduration').val());
            if (isNaN(newValue)) {
                return;
            }
            time.durations.push(newValue);
            rerender();
            $('#newduration').val(newValue);
        });
        registerBindingForClearance('button#adddurationc', 'click');

        $('#subjectBgColor').bind('change', updateSubjectBagroundColor);
        registerBindingForClearance('#subjectBgColor', 'change');
    }
    function _setCompareNextDay(dayIdx, buttonEl) {
        setCompare(1, dayIdx, buttonEl, 'dayBoxBottom');
    }
    function _setComparePrevDay(dayIdx, buttonEl) {
        setCompare(0, dayIdx, buttonEl, 'dayBoxTop');
    }
    function _setCompare() {
        var id = $(this).attr('id'),
            dayIdx = parseInt(id.replace(/^[bt]/, ''), 10);
        if ($(this).attr('id').match(/^b/)) {
            _setCompareNextDay(dayIdx, this);
        } else {
            _setComparePrevDay(dayIdx, this);
        }
    }
    function _buildCompareContainer(parentContainer, containerId, title, buttonIdPrefix, klass) {
        var button,
            compareContainer = _div(containerId),
            firstDay = _getFulldayName(_getFirstDay()),
            dayIndex = 0,
            i;

        compareContainer.append(_div().attr('class', 'compareTitle').html(title));
        while(days[dayIndex] !== firstDay) {
            dayIndex++;
        }
        for (i = 0; i < days.length; i++) {
            button = _button(buttonIdPrefix + i).attr({
                        'class': klass,
                     })
                     .click(_setCompare)
                     .html(days[dayIndex]);
            compareContainer.append(button);
            dayIndex++;
            dayIndex = dayIndex % 7;
        }

        // FIXME remove these commented out htmls
        /*
        <div id="compareContainer2">
        <div class="compareTitle">Next</div>
        <button id="b0" class="dayBoxBottom" onclick="schedule.setCompare(1, 0, this, 'dayBoxBottom')">Monday</button>
        <button id="b1" class="dayBoxBottom" onclick="schedule.setCompare(1, 1, this, 'dayBoxBottom')">Tuesday</button>
        <button id="b2" class="dayBoxBottom" onclick="schedule.setCompare(1, 2, this, 'dayBoxBottom')">Wednesday</button>
        <button id="b3" class="dayBoxBottom" onclick="schedule.setCompare(1, 3, this, 'dayBoxBottom')">Thursday</button>
        <button id="b4" class="dayBoxBottom" onclick="schedule.setCompare(1, 4, this, 'dayBoxBottom')">Friday</button>
        <button id="b5" class="dayBoxBottom" onclick="schedule.setCompare(1, 5, this, 'dayBoxBottom')">Saturday</button>
        <button id="b6" class="dayBoxBottom" onclick="schedule.setCompare(1, 6, this, 'dayBoxBottom')">Sunday</button>
        </div>*/
        $('#' + parentContainer).append(compareContainer);
    }
    function _setSelected(el, isSelected) {
        if (isSelected) {
            $(el).addClass('selected');
        } else {
            $(el).removeClass('selected');
        }
    }
    function getDayIndex(dateDayIndex) {
        // Javascript treats Sunday as the first day of the week (index 0)
        // We treat Monday as the first day fo the week (index 0).
        dateDayIndex = dateDayIndex -1;
        if (dateDayIndex < 0) {
            dateDayIndex = 6;
        }
        return dateDayIndex;
    }
    function _incrementDay(day) {
        day = day + 1;
        if (day > _Sunday) {
            day = _Monday;
        }
        return day;
    }
    function _decrementDay(day) {
        day = day - 1;
        if (day < _Monday) {
            day = _Sunday;
        }
        return day;
    }
    function _moveBackOrForward(direction) {
        var backward = (direction === 'back'),
            selected = -1,
            otherSelected;

        $('.dayBoxTop').each(function(i, e){
            if ($(e).hasClass('selected')) {
                selected = i;
            }
        });
        if (selected === -1) {
            selected = getDayIndex(new Date().getDay());
        }

        otherSelected = _incrementDay(selected);

        if (backward) {
            selected = _decrementDay(selected);
            otherSelected = _decrementDay(otherSelected);
        } else {
            selected = _incrementDay(selected);
            otherSelected = _incrementDay(otherSelected);
        }

        setCompare(0, selected, '#t'+selected, 'dayBoxTop');
        setCompare(1, otherSelected, '#b'+otherSelected, 'dayBoxBottom');
    }
    function moveToNextDay() {
        _moveBackOrForward('forward');
    }
    function moveToPrevDay() {
        _moveBackOrForward('back');
    }
    function _buildPrevNextButtons(containerId) {
        var prevButton = _button('prevButton').html('&lt;').attr('title', 'Move back one day'),
            nextButton = _button('nextButton').html('&gt;').attr('title', 'Move forward one day'),
            prevNextButtonsContainer = _div('prevNextButtonsContainer'),
            listOfButtonId = [ '#nextButton', '#prevButton' ],
            events = [ 'mousedown', 'mouseup', 'click' ],
            buttonId,
            i,
            j;

        prevNextButtonsContainer.append(prevButton, nextButton);
        /*
        <button id="prevButton">-</button>
        <button id="nextButton">+</button>*/
        $('#' + containerId).append(prevNextButtonsContainer);

        for(i = 0; i < listOfButtonId.length; i++) {
            buttonId = listOfButtonId[i];
            for(j = 0; j < events.length; j++) {
                $(buttonId).unbind(events[i]);
            }
        }
        $('#nextButton').mousedown(function() { _setSelected(this, true); });
        $('#prevButton').mousedown(function() { _setSelected(this, true); });
        $('#nextButton').mouseup(function() { _setSelected(this, false); });
        $('#prevButton').mouseup(function() { _setSelected(this, false); });
        $('#nextButton').click(moveToNextDay);
        $('#prevButton').click(moveToPrevDay);
    }
    function _buildCompareWidget(containerId) {
        var id = 'compareContainer';
        $(containerId).append(_div(id));
        _buildCompareContainer(id, id + '1', 'Previous', 't', 'dayBoxTop');
        _buildCompareContainer(id, id + '2', 'Next', 'b', 'dayBoxBottom');
        _buildPrevNextButtons(id);
    }
    function _buildInOutContainer(containerId) {
        var inOutContainer,
            takeInDiv,
            arrow,
            arrow1,
            schoolBagContainer,
            arrow2,
            takeOutDiv;

        /* <div id="inoutcontainer"> </div>*/
        inOutContainer = _div('inoutcontainer');

        /* <div class="inout" id="takein"></div> */
        takeInDiv = _div('takein').attr({'class':'inout'});
        /* <div class="arrow" title="in">&rarr;</div> */
        arrow = '➙';
        // arrow = '➤';
        // arrow = '➧';
        // arrow = '→'
        // arrow = '☞'; //'\u2799'; // '☞'; // '&rarr;'
        arrow1 = _div().attr({'class':'arrow',title:'in'}).html(arrow);
        /* <div id="schoolbagContainer"><img id="schoolbag" src="/images/schoolbag.png"/></div> */
        schoolBagContainer = _div('schoolbagContainer').append(
                                  _img('schoolbag').attr({
                                              src: [
                                                    settings.imageDir,
                                                    'schoolbag.png'
                                                ].join('/')
                                            }
                                        )
        );
        /* <div class="arrow" title="out">&rarr;</div> */
        arrow2 = _div().attr({'class':'arrow',title:'out'}).html(arrow);
        /* <div class="inout" id="takeout"></div> */
        takeOutDiv = _div('takeout').attr({'class':'inout'});

        inOutContainer.append(takeInDiv, arrow1, schoolBagContainer, arrow2, takeOutDiv);

        $(containerId).append(inOutContainer);
    }
    function _activateTodayCompare() {
        var date = new Date(),
            day = getDayIndex(date.getDay()),
            nextDay = day + 1
        ;
        if (nextDay > 6) {
            nextDay = 0;
        }
        setCompare(0, day, '#t'+day, 'dayBoxTop');
        setCompare(1, nextDay, '#b'+nextDay, 'dayBoxBottom');
    }
    function _buildOverlay(containerId) {
        var overlay = _div('overlay').css({
            display: 'none',
            position: 'absolute',
            'z-index': 1,
            top: 0,
            left: 0,
            width: 0,
            height: 0,
            border: 0,
            'background-color': '#000',
            '-ms-filter': "progid:DXImageTransform.Microsoft.Alpha(Opacity=50)",
            filter: 'alpha(opacity=50)',
            opacity: 0.5
        });
        $(containerId).append(overlay);
    }
    function _editSubject(brandNew, target) {
        var editSubjectDialog = $('#editSubjectDialog'),
            slotId = $(target).attr('id'),
            height = outerHeight(slotId),
            i,
            slot,
            currBackground
        ;
        editSubjectDialog.css('left', x(slotId) + halfWidth(slotId) - halfWidth('editSubjectDialog'));
        editSubjectDialog.css('top', y(slotId) + height);
        i = getSelectedIndex(target);
        slot = settings.schedule.internal[i.row][i.idx];
        $('#newSubject').val(slot.s);
        $('#newDuration').val(slot.d);
        $('#nobooks').attr('checked', slot.nobook || false);
        currBackground = $(target).css('background-color');
        if (brandNew) {
            currBackground = getSubjectBgColor(slot);
        }
        // $('#subjectBgColor').attr('value', currBackground);
        $('#icp_subjectBgColor').css('background-color', currBackground);
        $('#subjectBgColor').val(currBackground);
        hideEdit();
        editDialogIsVisible = 1;
        editSubjectDialog.show('fast');
        $('#newSubject').focus().select();
    }
    function _editTime(target) {
        var editTimeDialog = $('#editTimeDialog'),
            slotId = $(target).attr('id'),
            height = outerHeight(slotId),
            i,
            duration
        ;
        editTimeDialog.css('left', x(slotId) + halfWidth(slotId) - halfWidth('editTimeDialog'));
        editTimeDialog.css('top', y(slotId) + height);
        i = getSelectedIndex(target);
        duration = settings.schedule.time.durations[i.idx];
        $('#newTimeDuration').val(duration);
        hideEdit();
        editTimeDialog.show('fast');
        $('#newTimeDuration').focus().select();
    }
    function editSlot(evt) {
        thisIsANewSlot = 0;
        elementToEdit = currMouseOvered;
        setButtonEnabled('#addduration', false);
        if (onSubject) {
            return _editSubject(0, elementToEdit);
        } else if (onTime) {
            return _editTime(elementToEdit);
        }
    }
    function _insertNewSubjectSlot(offset, relativeTo) {
        var i = getSelectedIndex(relativeTo),
            newSlot = { s: '', d: mostFrequentDuration },
            idx = i.idx + offset,
            id,
            brandNew
        ;
        settings.schedule.internal[i.row].splice(idx, 0, newSlot);
        hideEdit();
        rerender();
        id = getId(i.row, idx);
        $(id).css('display', 'none');
        elementToEdit = id;
        $(id).show('fast', function() {
                brandNew = 1;
                _editSubject(brandNew, elementToEdit);
            }
        );
    }
    function _insertNewTimeSlot(offset, defaultDuration, relativeTo) {
        var i = getSelectedIndex(relativeTo),
            idx = i.idx + offset,
            id
        ;
        settings.schedule.time.durations.splice(idx, 0, defaultDuration || mostFrequentDuration);
        hideEdit();
        rerender();
        id = 'time' + idx;
        $(id).css('display', 'none');
        $(id).show();
    }
    function _insertNewSlot (offset, relativeTo) {
        thisIsANewSlot = 1;
        if (onSubject) {
            return _insertNewSubjectSlot(offset, relativeTo);
        } else if (onTime) {
            return _insertNewTimeSlot(offset, null, relativeTo);
        }
    }
    function insertLeft(evt) {
        var relativeTo = currMouseOvered;
        _insertNewSlot(0, relativeTo);
    }
    function insertRight(evt) {
        var relativeTo = currMouseOvered;
        _insertNewSlot(1, relativeTo);
    }
    function _swapTwoArrayElements(array, a, b) {
        var move = array.splice(a, 1);
        array.splice(b, 0, move[0]);
    }
    function _moveTimeLeft(slotToMove) {
        var i = getSelectedIndex(slotToMove);
        if (i.idx <= 1) {
            return;
        }
        _swapTwoArrayElements(settings.schedule.time.durations, i.idx, i.idx - 1);
        rerender();
        hideEdit();
    }
    function _moveSubjectLeft(slotToMove) {
        var i = getSelectedIndex(slotToMove);
        if (i.idx <= 1) {
            return;
        }
        _swapTwoArrayElements(settings.schedule.internal[i.row], i.idx, i.idx - 1);
        rerender();
        hideEdit();
    }
    function moveLeft(evt) {
        var slotToMove = currMouseOvered;
        if (onTime) {
            return _moveTimeLeft(slotToMove);
        } else if (onSubject) {
            return _moveSubjectLeft(slotToMove);
        }
    }
    function _moveTimeRight(slotToMove) {
        var i = getSelectedIndex(slotToMove);
        if (i.idx >= settings.schedule.time.durations.length - 1) {
            return;
        }
        _swapTwoArrayElements(settings.schedule.time.durations, i.idx, i.idx + 1);
        rerender();
        hideEdit();
    }
    function _moveSubjectRight(slotToMove) {
        var i = getSelectedIndex(slotToMove),
            row = settings.schedule.internal[i.row],
            idx = i.idx
        ;
        if (idx >= row.length - 1) {
            return;
        }
        _swapTwoArrayElements(row, i.idx, i.idx + 1);
        rerender();
        hideEdit();
    }
    function moveRight(evt) {
        var slotToMove = currMouseOvered;
        if (onTime) {
            return _moveTimeRight(slotToMove);
        } else if (onSubject) {
            return _moveSubjectRight(slotToMove);
        }
    }
    function _buildEditWidget(containerId) {
        var editWidget = $('<div>')
                            .addClass('editWidget')
                            .attr('id','editOption'),
            listOfActions = {
                editSubject: {
                                click: editSlot,
                                title: "Edit",
                                label: "..."
                },
                removeSlot: {
                                click: removeSlot,
                                title: "Remove",
                                label: "x"
                },
                insertBefore: {
                                click: insertLeft,
                                title: "Insert before",
                                label: "+"
                },
                insertAfter: {
                                click: insertRight,
                                title: "Insert after",
                                label: "+"
                },
                moveLeft: {
                            click: moveLeft,
                            title: "Move left",
                            label: "&lt;"
                },
                moveRight: {
                            click: moveRight,
                            title: "Move right",
                            label: "&gt;"
                },
            },
            id,
            action,
            button
        ;
        for (id in listOfActions) {
            if (listOfActions.hasOwnProperty(id)) {
                action = listOfActions[id];
                button = $('<button>' + action.label + '</button>')
                            .attr('id', id)
                            .click(action.click)
                            .attr('title', action.title);
                editWidget.append(button);
            }
        }
        $(containerId).append(editWidget);
    }
    function _buildEditTimeDialog(containerId) {
        var inputLabel = $('<label>')
                            .attr('class', 'leftlabel')
                            .html('Duration:<br>(Minutes)'
            ),
            input = $('<input>')
                        .attr({
                            id:'newTimeDuration',
                            type: 'text',
                            size: 3,
                            maxlength: 3
                        })
                        .keyup(animateSlotSize),
            newTimeDurationInput = $('<div>')
                                    .append(inputLabel)
                                    .append(input),
            cancelButton = $('<button>')
                            .click(hideEditTimeDialog)
                            .attr('id', 'etdCancel')
                            .html('Cancel'),
            okButton = $('<button>')
                        .click(etdOK)
                        .attr('id', 'etdOK')
                        .html('OK'),
            buttonsContainer = $('<div>')
                                .attr('class', 'buttonsC')
                                .append(okButton)
                                .append(cancelButton),
            dialog = $('<div>')
                        .attr('id', 'editTimeDialog')
                        .append(newTimeDurationInput)
                        .append(buttonsContainer)
        ;

        $(containerId).append(dialog);

        /*
            <div>
                <label class="leftlabel">Duration:<br>(Minutes) </label>
                <input id="newTimeDuration" type="text" size="3" maxlength="3"/>
            </div>
            <div class="buttonsC">
                <button onclick="schedule.hideEditTimeDialog()" id="etdCancel">Cancel</button>
                <button onclick="schedule.etdOK()" id="etdOK">OK</button>
            </div>
        */
    }
    function overlayOn(below, above) {
        var offset,
            width,
            height
        ;
        below = $(below);
        offset = below.offset();
        width = below.outerWidth();
        height = below.outerHeight();
        $('#overlay').css({
            display: 'block',
            top: offset.top,
            left: offset.left,
            width: width,
            height: height
        });
        $(above).css('z-index', 2);
    }
    function askForBooks() {
        var whenshown;
        overlayOn('#editSubjectDialog', '#addBookDialog');
        putAbsBottomOf('addbooks', 'addBookDialog');
        $('#booklist').html('');
        $('#addBookDialog').trigger('renderbooklist');
        whenshown = function() {
            $('#bookname').focus().select();
        };
        $('#addBookDialog').show('fast', whenshown);
    }
    function _buildEditSubjectDialog(containerId) {
        /* <div id="editSubjectDialog"></div> */
        var editSubjectDialog = _div('editSubjectDialog').mouseover(hideEdit),
            label = _label()
                    .attr('class', 'leftlabel')
                    .html('Subject:'),
            input = _input('newSubject').attr({
                                            type: 'text',
                                            size: 4,
                                            maxlength: 100 // "Should be enough for everybody"
            }),
            id,
            booksButton,
            label2,
            cancelButton,
            okButton
        ;
        /*
        <div>
            <label class="leftlabel">Subject: </label>
            <input id="newSubject" type="text" size="4" maxlength="4"/>
        </div>*/
        editSubjectDialog.append(_div().append(label, input));

        id = 'subjectBgColor';

        label = _label()
                .attr('for', id)
                .html('Background:');
        input = _input(id)
                .attr({
                    type: 'color',
                    name: 'color4', // FIXME 4?
                    'data-text': 'hidden',
                    value: 'white',
                    'class': 'color'
                })
                .css({
                    height: '20px',
                    width: '20px',
                });
        /*
        <div>
            <label for="subjectBgColor">Background:</label>
            <input id="subjectBgColor" type="color" name="color4" data-text="hidden"
            style="height:20px;width:20px;" value="white" class="color"/>
        </div>*/
        editSubjectDialog.append(_div().append(label, input));

        booksButton = _button('addbooks').html('Books ...').click(askForBooks);
        editSubjectDialog.append(booksButton);

        label = _label()
                .attr('class', 'leftlabel')
                .html('&nbsp');
        input = _input('nobooks')
                .attr({
                    type: 'checkbox'
                });
        label2 = _label()
                     .attr('for', 'nobooks')
                     .html('No books');
        /*
        <div>
            <label class="leftlabel">&nbsp;</label>
            <input id="nobooks" type="checkbox"/>
            <label for="nobooks">No books</label>
        </div>*/
        editSubjectDialog.append(_div().append(label, input, label2));

        label = _label()
                .attr('class', 'leftlabel').html('Duration:<br>(Minutes)');
        input = _input('newDuration').
                attr({
                    type: 'text',
                    size: 3,
                    maxlength: 3
                });
        /*
        <div>
            <label class="leftlabel">Duration:<br>(Minutes) </label>
            <input id="newDuration" type="text" size="3" maxlength="3"/>
        </div>*/
        editSubjectDialog.append(_div().append(label, input));

        cancelButton = _button('esdCancel')
                           .click(hideEditSubjectDialog)
                           .html('Cancel');
        okButton = _button('esdOK')
                       .click(esdOK)
                       .html('OK');
        /*
        <div class="buttonsC">
            <button onclick="schedule.hideEditSubjectDialog()" id="esdCancel">Cancel</button>
            <button onclick="schedule.esdOK()" id="esdOK">OK</button>
        </div>*/
        editSubjectDialog.append(
                _div().attr('class','buttonsC')
                .append(okButton, cancelButton));
        $(containerId).append(editSubjectDialog);
        $('#' + id).mColorPicker();
    }
    function addBookListTableHeader(booklisttable) {
        var headers = [ 'Name', 'Use here', 'Action' ],
            i
        ;
        for (i = 0; i < headers.length; i++) {
            headers[i] = _th().html(headers[i]);
        }
        booklisttable.append.apply(booklisttable, headers);
    }
    function getEventTarget(evt) {
        var target;
        if (!evt) {
            evt = window.event;
        }
        if (evt.target) {
            target = evt.target;
        } else if (evt.srcElement) {
            target = evt.srcElement;
        }
        if (target.nodeType === 3) { // defeat Safari bug
            target = target.parentNode;
        }
        return target;
    }
    function updatePendingSlotBooksAction(evt) {
        var checkbox,
            bookname
            ;

        checkbox = getEventTarget(evt);
        bookname = getBookNameFromCheckbox(checkbox);
        if ($(checkbox).is(':checked')) {
            setPendingSlotBooksAction(bookname, USE_HERE);
        } else {
            setPendingSlotBooksAction(bookname, DO_NOT_USE_HERE);
        }
        $('#addBookOk').show();
    }
    function createBookListEntry(index, name, usehere) {
        var bookname = _td('bookName_' + index).html(name).attr('class', 'survivingBook'),
            checkboxInTd = _td()
                        .append(
                            _checkbox('bookUseHere_' + index)
                                .attr('checked', usehere)
                                .change(updatePendingSlotBooksAction)
                        )
                        .css('text-align', 'center'),
            removeLink = _td().append(
                            _a('bookRemove_' + index)
                                .html('remove')
                                .attr('href', '#')
                                .click(removeBookInView)
            );
        return _tr().append(bookname, checkboxInTd, removeLink);
    }
    function addBookInView(evt) {
        var name,
            booklisttable,
            nbooks,
            usehere
        ;
        name = replaceUnsaveChars(trimString($('#bookname').val()));
        if (name.length === 0) {
            return;
        }
        // Replace multiple spaces with only one
        name = replaceUnsaveChars(name.replace(/ {1} */g, ' '));
        booklisttable = $('#booklist');
        nbooks = booklisttable.children().length;
        usehere = true;
        if (booklisttable.children().size() === 0) {
            addBookListTableHeader(booklisttable);
        }

        booklisttable.append(createBookListEntry(nbooks, name, usehere));
        dirtyBookList = $('#booklistheader').html();
        $('#addBookOk').fadeIn();
    }
    function _buildAddBookDialog(containerId) {
        var addBookDialog,
            booklistc,
            booknameInput,
            addButton,
            okButton,
            cancelButton
        ;

        addBookDialog = _div('addBookDialog').attr('class', 'dialog');

        // addBookDialog.append(_a('closeAddBookDialog').html('close').css({
        //     display: 'block',
        //     float: 'right'
        // }).attr({
        //     href: 'javascript:;'
        // }).click(hideAddBookDialog));

        booklistc = _div('booklistc');
        booklistc.append(_div('booklistheader'));
        booklistc.append(_table('booklist'));
        addBookDialog.append(booklistc);

        booknameInput = _input('bookname').attr({
            type: 'text',
            placeHolder: 'Book name',
            size: 60,
            maxlength: 100
        });
        addButton = _button('addbook').html('Add').click(addBookInView);
        addBookDialog.append(booknameInput, addButton);

        okButton = _button('addBookOk')
                            .html('OK')
                            .click(updateBookList).hide();
        cancelButton = _button('addBookCancel')
                            .html('Cancel')
                            .click(hideAddBookDialog);
        addBookDialog.append(_div().attr('class','clear'));
        addBookDialog.append(_div('bookButtonsC')
                                .append(cancelButton, okButton)
        );

        addBookDialog.bind('renderbooklist', renderBookList);
        $(containerId).append(addBookDialog);
    }
    function updateBookList() {
        var subject,
            cssClass,
            slotsAffected,
            i, el, id, isJadualSlot,
            bookList,
            slot,
            idx,
            slotBookDict,
            newBookListDict = {},
            survivingBookList,
            bookname
        ;
        if (! dirtyBookList) {
            updateSlotUseHereStatus();
            hideAddBookDialog();
            return;
        }

        subject = dirtyBookList;
        cssClass = getSubjectCssClassName({s:subject});
        slotsAffected = $('.' + cssClass);
        bookList = getBooksFor({s:subject});

        bookList.length = 0;
        survivingBookList = $('.survivingBook');
        for (i = 0; i < survivingBookList.length; i++) {
            bookname = $(survivingBookList[i]).html();
            newBookListDict[bookname] = 1;
            bookList.push(bookname);
        }

        for(i = 0; i < slotsAffected.length; i++) {
            el = slotsAffected[i];
            id = $(el).attr('id');
            if (!id) {
                continue;
            }
            isJadualSlot = id.match(/^j/);
            if (! isJadualSlot) {
                continue;
            }
            idx = _getSelectedSubjectIndex(el);
            slot = settings.schedule.internal[idx.row][idx.idx];
            slot.books = slot.books || {};
            // Step one of three: Set all suriving book to be used in that slot
            // if it is not yet there.
            for (bookname in newBookListDict) {
                if (newBookListDict.hasOwnProperty(bookname)) {
                    if (typeof slot.books[bookname] === 'undefined') {
                        slot.books[bookname] = USE_HERE;
                    }
                }
            }
            // Step two of three: Delete orphaned books.
            for (bookname in slot.books) {
                if (slot.books.hasOwnProperty(bookname)) {
                    if (! newBookListDict[bookname]) {
                        delete slot.books[bookname];
                    }
                }
            }
        }
        // FIXME update slot.books for use here
        // Step two of three: Set all book for selected slot according to
        // pendingSlotBooksAction.
        updateSlotUseHereStatus();

        hideAddBookDialog();
    }
    function updateSlotUseHereStatus() {
        // FIXME refactor these three or four lines into a function, we see
        // many patterns like it all over the place - goal is to get the 'latest'
        // status of the currently edited subject, which may be different than
        // the one we have in schedule.internal[x][y]
        var idx = _getSelectedSubjectIndex(elementToEdit),
            slot = settings.schedule.internal[idx.row][idx.idx],
            bookname;

        var books = getOrCreateSlotBookDict(slot);
        for (bookname in pendingSlotBooksAction) {
            if (pendingSlotBooksAction.hasOwnProperty(bookname)) {
                books[bookname] = pendingSlotBooksAction[bookname];
            }
        }
    }
    function getOrCreateSlotBookDict(slot) {
        var books = slot.books;
        if (! books) {
            slot.books = {};
        }
        return slot.books;
    }
    function renderBookList(evt) {
        pendingSlotBooksAction = {};
        var subjectName = replaceUnsaveChars($('#newSubject').val()),
            idx = getSelectedIndex(elementToEdit),
            slot = settings.schedule.internal[idx.row][idx.idx],
            booklist,
            i,
            booklisttable = $('#booklist'),
            usehere,
            bookname,
            assumeUseAllBook = false,
            slotBookDict
        ;

        if (slot.s !== subjectName) {
            assumeUseAllBook = true;
        }
        booklist =  getBooksFor({s:subjectName});

        dirtyBookList = false;

        $('#booklistheader').html(subjectName);
        if (booklist.length > 0) {
            addBookListTableHeader(booklisttable);
        }

        slotBookDict = getOrCreateSlotBookDict(slot);
        for (i = 0; i < booklist.length; i++) {
            bookname = booklist[i];
            usehere = slotBookDict[bookname] || assumeUseAllBook;
            booklisttable.append(createBookListEntry(i, bookname, usehere));
        }
    }
    function hideAddBookDialog(evt) {
        $('#addBookDialog').hide();
        overlayOff('#addBookDialog');
        $('#addBookOk').hide();
    }
    function overlayOff(above) {
        $('#overlay').hide();
        $(above).css('z-index', 0);
    }
    function getBookNameFromCheckbox(checkbox) {
        var checkboxId = $(checkbox).attr('id'),
            bookRowIdx = checkboxId.split('_')[1],
            bookname = getBookNameFromRowIndex(bookRowIdx);
        return bookname;
    }
    function setPendingSlotBooksAction(bookname, use_or_not) {
        pendingSlotBooksAction[bookname] = use_or_not;
    }
    function getBookNameFromRowIndex(bookRowIdx) {
        var bookNameId = '#bookName_' + bookRowIdx;
        return $(bookNameId).html();
    }
    function removeBookInView(evt) {
        // Called when 'remove' <a> link is clicked
        var id = $(this).attr('id'),
            indexToRemove = _intValue(id.split('_')[1]),
            bookname = getBookNameFromRowIndex(indexToRemove),
            td = this.parentNode,
            tr = td.parentNode,
            table = tr.parentNode
        ;
        setPendingSlotBooksAction(bookname, DO_NOT_USE_HERE);
        $(this).unbind('click');
        table.removeChild(tr);
        dirtyBookList = $('#booklistheader').html();
        $('#addBookOk').fadeIn();
        return false;
    }
    function _removeDictEntriesExcept(keysWanted, dict) {
        var entry;
        for(entry in dict) {
            if (dict.hasOwnProperty(entry)) {
                if (!keysWanted[entry]) {
                    delete dict[entry];
                }
            }
        }
    }
    function _sanitize() {
        var subjectExists = {},
            subjectCssClassName
        ;
        _foreach(settings.schedule.internal, function(dayRow) {
            _foreach(dayRow, function(dayslot) {
                subjectCssClassName = getSubjectCssClassName(dayslot);
                subjectExists[subjectCssClassName] = 1;
                _removeDictEntriesExcept({ s:1, d:1, c:1, nobook:1, books:1 }, dayslot);
            });
        });
        _removeDictEntriesExcept(subjectExists, settings.schedule.bgColor);
        return settings.schedule.internal;
    }
    function deInternalize() {
        var internalized = _sanitize(),
            dailySlots = {},
            i,
            slots,
            fullDayName
        ;
        for (i = 0; i < internalized.length; i++) {
            slots = internalized[i];
            fullDayName = _getFulldayName(slots[0].s);
            if (slots.length > 1) {
                dailySlots[fullDayName] = slots.slice(1);
            }
        }
        return dailySlots;
    }
    function internalizeOptions(options) {
        var dayName,
            i,
            j,
            subject,
            shortDayName,
            slots,
            timetable = [
                [ {"s": "Mo", "d": dayWidth, "c": "day"} ],
                [ {"s": "Tu", "d": dayWidth, "c": "day"} ],
                [ {"s": "We", "d": dayWidth, "c": "day"} ],
                [ {"s": "Th", "d": dayWidth, "c": "day"} ],
                [ {"s": "Fr", "d": dayWidth, "c": "day"} ],
                [ {"s": "Sa", "d": dayWidth, "c": "day"} ],
                [ {"s": "Su", "d": dayWidth, "c": "day"} ]
            ]
        ;
        if (options.schedule) {
            if (options.schedule.time) {
                options.schedule.time.offset = dayWidth;
            }

            if (options.schedule.dailySlots) {
                for (i = 0; i < days.length; i++) {
                    dayName = days[i];
                    if (options.schedule.dailySlots[dayName]) {
                        slots = options.schedule.dailySlots[dayName];
                        for (j = 0; j < slots.length; j++) {
                            timetable[i].push(slots[j]);
                        }
                    }
                }
            }
            /* Shift daily slot array so that it starts at startDay */
            if (options.schedule.startDay && options.schedule.startDay != 'Monday') {
                shortDayName = options.schedule.startDay.substr(0, 2);
                i = 0;
                while (shortDayName !== timetable[0][0].s) {
                    timetable.push(timetable.shift());
                    i += 1;
                    if (i > 7) {
                        throw 'startDay is not valid';
                    }
                }
            }
            if (! options.schedule.internal) {
                options.schedule.internal = timetable;
            }

            if (options.schedule.bgColor) {
                for(subject in options.schedule.bgColor) {
                    if (options.schedule.bgColor.hasOwnProperty(subject)) {
                        options.schedule.bgColor[getSubjectCssClassName({s:subject})] =
                            options.schedule.bgColor[subject];
                    }
                }
            }
        }
    }

    var methods = {
        init : function( options ) {
            if (options) {
                internalizeOptions(options);
            }
            var settingsHere = {
                edit: false,
                imageDir: 'images',
                schedule: {
                    "time": {
                        "start": {"hour": 7, "minute": 40},
                        "offset": dayWidth,
                        "durations": [30]
                    },
                    "internal": [
                        [ {"s": "Mo", "d": dayWidth, "c": "day"} ],
                        [ {"s": "Tu", "d": dayWidth, "c": "day"} ],
                        [ {"s": "We", "d": dayWidth, "c": "day"} ],
                        [ {"s": "Th", "d": dayWidth, "c": "day"} ],
                        [ {"s": "Fr", "d": dayWidth, "c": "day"} ],
                        [ {"s": "Sa", "d": dayWidth, "c": "day"} ],
                        [ {"s": "Su", "d": dayWidth, "c": "day"} ]
                    ],
                    bgColor : {},
                    booksFor: [],
                    pixel_per_minute: 1.8
                },
                eventBindings: {},
            },
            extended, key;

            if ( options ) {
                extended = $.extend( {}, settingsHere, options );
                for ( key in settingsHere.schedule ) {
                    if (settingsHere.schedule.hasOwnProperty(key)) {
                        if ( !extended.schedule[key] ) {
                            extended.schedule[key] = settingsHere.schedule[key];
                        }
                    }
                }
                settingsHere = extended;
            }

            return this.each(function(){
                var $this = $(this),
                    data = $this.data('timetable');

                if ( ! data ) {
                    $(this).data('timetable', {
                        target : $this,
                        firstRender : true,
                    });
                }
                $(this).data('timetable').settings = settingsHere;
            });
        },
        destroy : function( ) {
            return this.each(function(){
                var $this = $(this),
                    data = $this.data('timetable');

                $(window).unbind('.timetable');
                data.timetable.remove();
                $this.removeData('timetable');
            });
        },
        getBooksFor : getBooksFor,
        rerender : rerender,
        render : function(autoCompareToday, viaCallback) {
            renderedAt = this;
            return this.each(function() {
                var $this = $(this),
                    data = $this.data('timetable'),
                    // TODO get rid of assumption that it has id
                    id =  $this.attr('id'),
                    containerId = '#' + id,
                    html = [];

                settings = $this.data('timetable').settings;

                if ($('#dayTimeScale').size() === 0) {
                    if (settings.edit) {
                        _buildDayTimeScaleWidget(containerId);
                    }
                }
                if (settings.edit) {
                    $('#dayTimeScale').show();
                } else {
                    $('#dayTimeScale').hide();
                }

                timetableId = id + '-timetable';
                if ($('#' + timetableId).size() === 0) {
                    $this.append(_div(timetableId));
                } else {
                    if (!data.firstRender) {
                        clearAllEventBindings();
                    }
                    $('#' + timetableId).innerHTML = '';
                }
                timetableWidth = renderTime(settings.schedule.time, html);
                _foreach(settings.schedule.internal, renderDaily, { funargs:{html: html}});
                $('#' + timetableId).html(html.join(''));
                $('#' + timetableId).css('width', timetableWidth + 'px');

                if ($('#compareContainer').size() === 0) {
                    // _buildBookListEditor(containerId);
                    _buildCompareWidget(containerId);
                    _buildInOutContainer(containerId);
                }
                // // populateBookListWidget();

                if (autoCompareToday) {
                    _activateTodayCompare();
                }

                if (settings.edit) {
                    if ($('#editSubjectDialog').size() === 0) {
                        _buildOverlay(containerId);
                        _buildEditWidget(containerId);
                        _buildEditTimeDialog(containerId);
                        _buildEditSubjectDialog(containerId);
                        _buildAddBookDialog(containerId);
                    }
                    enableEditMode();

                    // TODO move these to a more appropriate location - we
                    // don't want to repeat it unnecessarily
                    $('#mColorPicker').css('height','158px');
                    $('#mColorPickerFooter').css('height', '0px'); /* 184px (height) - 26px (footer) */
                }
                data.firstRender = false;

            });
        },
        durationToSize : durationToSize,
        serialize : function() {
            var sched = settings.schedule;
            return JSON.stringify({
                time : sched.time,
                dailySlots : deInternalize(),
                startDay : _getFulldayName(sched.internal[0][0].s),
                bgColor : sched.bgColor,
                booksFor : sched.booksFor,
                pixel_per_minute : sched.pixel_per_minute
            });
    }
  };

  $.fn.timetable = function( method ) {

    if ( methods[method] ) {
      return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
    } else if ( typeof method === 'object' || ! method ) {
      return methods.init.apply( this, arguments );
    } else {
      $.error( 'Method ' +  method + ' does not exist on jQuery.timetable' );
    }

  };

}( jQuery ));
/* vim: set ts=4 sts=4 sw=4 expandtab: */
