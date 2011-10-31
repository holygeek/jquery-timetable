// FIXME Hoist all vars
$(document).ready(function(){
// Ensure asyncTest are run asynchronously, no matter what. See
// https://github.com/jquery/qunit/issues/138
QUnit.config.reorder = false;

var days = [ 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday' ],
    jadual,
    dayWidth = 70,
    jadualWithBooks,
    time = {
        start: {hour: 7, minute: 40},
        offset: dayWidth,
        durations: [30]
    },
    schedule = { time: time, bgColor: {} },
    i, j;

$('#testbed').append($('<div/>').attr('id', 'timetable'));
schedule = $('#timetable').timetable({ schedule: schedule, edit: 1});
schedule.timetable('render');

function isVisible(id) {
    return $(id).css('display') != 'none';
}
function getScheduleObject(schedule) {
  return JSON.parse(schedule.timetable('serialize'));
}
function insertAfter(row, col) {
    var id = '#j' + row + '_' + col;
    $(id).trigger('mouseover');
    $('#insertAfter').trigger('click');
}
function addTimeSlot(duration) {
    $('#newduration').val(duration);
    $('#addduration').trigger('click');
}
function addSlotAfter(row, col, subjectName, duration) {
    insertAfter(row, col);
    $('#newSubject').autotype(subjectName);
    if (typeof duration !== 'undefined') {
        $('#newDuration').val(duration);
    }
    clickEditSubjectDialogOKButton();
}
function setCheckBoxStatus(selector, status) {
    $(selector).prop('checked', status);
}
function getCheckBoxStatus(selector) {
    return $(selector).prop('checked');
}
function selectPreviousOrNext(day, idBase) {
    var idx = 0,
        button;
    for(idx = 0; idx < 7; idx++) {
        button = $(idBase + idx);
        if (button.html() == day) {
            button.trigger('click');
            return;
        }
    }
    throw "Could not find matching previous/next button for day = [" + day + "]";
}
function selectNext(day) {
    selectPreviousOrNext(day, '#b');
}
function selectPrev(day) {
    selectPreviousOrNext(day, '#t');
}
function addBookToSlot(row, col, bookname) {
    editSubject(row, col);
    clickBooksButton();
    setBookNameEntry(bookname);
    clickAddBookButton();
    clickAddBookOKButton();
    clickEditSubjectDialogOKButton();
}

function clickEditSubjectDialogCancelButton() {
    $('#esdCancel').trigger('click');
}
function clickEditSubjectDialogOKButton() {
    $('#esdOK').trigger('click');
}
function editSubject(row, col) {
    var slotId = '#j' + row + '_' + col;
    $(slotId).trigger('mouseover');
    $('#editSubject').trigger('click');
}
function clickBooksButton() {
    $('#addbooks').trigger('click');
}
function setBookNameEntry(bookname) {
    $('#bookname').val('');
    $('#bookname').autotype(bookname);
}
function clickAddBookButton() {
    $('#addbook').trigger('click');
}
function clickAddBookOKButton() {
    $('#addBookOk').trigger('click');
}
function clickAddBookCancelButton() {
    $('#addBookCancel').trigger('click');
}

module("Edit");
asyncTest("First Load", function() {
  expect(9);
  equal($('#startHour').val(), '7', 'Start hour is 7');
  equal($('#startMinute').val(), '40', 'Start minute is 40');
  var hourSelectedText = $("#startHour option[value='" + $('#startHour').val() + "']").text();
  var minuteSelectedText = $("#startMinute option[value='" + $('#startMinute').val() + "']").text();
  equals(hourSelectedText, '07', "Start hour selected shown is 07");
  equals(minuteSelectedText, '40', "Start minute selected shown is 40");

  equal($('#time0').html(), '07:40<br>08:10', 'Start time displayed correctly');

  equal($('#startDay').val(), 'Monday', 'Start day is Monday');
  equal($('#j0_0').html(), 'Mo', "First day is Monday");

  equals($('#t0').html(), 'Monday', 'First Previous button is Monday');
  equals($('#b0').html(), 'Monday', 'First Next button is Monday');
  start();
});

asyncTest("Change start day", function() {
    var dayIndex = 6,
        i
    ;
    expect(63);
    $('#startDay').val('Sunday').trigger('change');
    equal($('#j0_0').html(), 'Su', "First day is now Sunday");
    equal($('#j1_0').html(), 'Mo', "First day is now Sunday");
    equal($('#j2_0').html(), 'Tu', "First day is now Sunday");
    equal($('#j3_0').html(), 'We', "First day is now Sunday");
    equal($('#j4_0').html(), 'Th', "First day is now Sunday");
    equal($('#j5_0').html(), 'Fr', "First day is now Sunday");
    equal($('#j6_0').html(), 'Sa', "First day is now Sunday");

    dayIndex = 6;
    for (i = 0; i < 7; i++) {
        equals($('#t' + i).html(), days[dayIndex], 'Sunday start day: Previous button are ok');
        equals($('#b' + i).html(), days[dayIndex], 'Sunday start day: Next button are ok');
        dayIndex++;
        if (dayIndex > 6) {
            dayIndex = 0;
        }
    }

    $('#startDay').val('Thursday').trigger('change');
    equal($('#j0_0').html(), 'Th', "First day is now Thursday");
    equal($('#j1_0').html(), 'Fr', "First day is now Thursday");
    equal($('#j2_0').html(), 'Sa', "First day is now Thursday");
    equal($('#j3_0').html(), 'Su', "First day is now Thursday");
    equal($('#j4_0').html(), 'Mo', "First day is now Thursday");
    equal($('#j5_0').html(), 'Tu', "First day is now Thursday");
    equal($('#j6_0').html(), 'We', "First day is now Thursday");

    dayIndex = 3;
    for (i = 0; i < 7; i++) {
        equals($('#t' + i).html(), days[dayIndex], 'Thursday start day: Previous button are ok');
        equals($('#b' + i).html(), days[dayIndex], 'Thursday start day: Next button are ok');
        dayIndex++;
        if (dayIndex > 6) {
            dayIndex = 0;
        }
    }

    $('#startDay').val('Monday').trigger('change');
    equal($('#j0_0').html(), 'Mo', "First day is now Monday");
    equal($('#j1_0').html(), 'Tu', "First day is now Monday");
    equal($('#j2_0').html(), 'We', "First day is now Monday");
    equal($('#j3_0').html(), 'Th', "First day is now Monday");
    equal($('#j4_0').html(), 'Fr', "First day is now Monday");
    equal($('#j5_0').html(), 'Sa', "First day is now Monday");
    equal($('#j6_0').html(), 'Su', "First day is now Monday");

    dayIndex = 0;
    for (i = 0; i < 7; i++) {
        equals($('#t' + i).html(), days[dayIndex], 'Monday start day: Previous button are ok');
        equals($('#b' + i).html(), days[dayIndex], 'Monday start day: Next button are ok');
        dayIndex++;
        if (dayIndex > 6) {
            dayIndex = 0;
        }
    }

    start();
});

asyncTest("Edit time slot details '...' button appears on mouseover", function() {
  var firstTimeSlot = $('#time0');
  expect(1);
  firstTimeSlot.trigger('mouseover');
  ok(isVisible('#editSubject'), "'...' button appear on mouseover over time slot");
  start();
});

asyncTest("Edit time slot dialog appear when '...' button is clicked, disappear when 'Cancel' is clicked", function() {
  var firstTimeSlot = $('#time0');
  expect(5);
  firstTimeSlot.trigger('mouseover');
  ok(isVisible('#editSubject'), "'...' button is visible on mouseover of time slot");
  $('#editSubject').trigger('click');
  ok(isVisible('#editTimeDialog'), 'Edit time dialog is visible after clicking "..."');
  ok(isVisible('#etdOK'), "'OK' button in edit time dialog is visible");
  ok(isVisible('#etdCancel'), "'Cancel' button in edit time dialog is visible");
  $('#etdCancel').trigger('click');
  ok(!isVisible('#editTimeDialog'), 'Edit time dialog is hidden after cancel button is clicked');
  start();
});

asyncTest("Add first subject, click Cancel", function() {
  var mondayBox = '#j0_0',
      newSubjectBox = '#j0_1',
      firstMoSubject = '#j0_1',
      pink
  ;
  expect(7);
  $(mondayBox).trigger('mouseover');
  ok(isVisible('#insertAfter'), '#insertAfter button is shown');
  $('#insertAfter').trigger('click');
  ok(isVisible(newSubjectBox), 'Box for new subject is created');
  ok(isVisible('#editSubjectDialog'), 'Edit subject dialog is visible on addition of new subject');
  $('#newSubject').autotype('{{back}}BM');
  $('#newSubject').trigger('keyup');

  // Get the first subject for Monday
  equal($(firstMoSubject).html(), 'BM', "New subject text is BM");
  pink = 'rgb(255, 192, 203)';
  $('#subjectBgColor').val(pink).trigger('change');
  // Just to be consistent:
  $('#icp_subjectBgColor').css('background-color', pink);
  equal($(firstMoSubject).css('background-color'), pink, "New subject color is " + pink);
  $('#nobooks').prop('checked', false);
  $('#esdCancel').trigger('click');
  ok(!isVisible('#editSubjectDialog'), 'Edit subject dialog is hidden after clicking OK');
  // equal($(firstMoSubject).html(), '', "New subject text is '' after Cancelling");
  j = getScheduleObject(schedule);
  equal(j.dailySlots['Monday'], undefined, "No subject after cancelling add subject on Monday.");
  start();
});

asyncTest("Add first subject, with OK button", function() {
  var mondayBox = '#j0_0',
      newSubjectBox = '#j0_1',
      firstMoSubject = '#j0_1',
      pink = 'rgb(255, 192, 203)'
  ;
  expect(7);
  $(mondayBox).trigger('mouseover');
  ok(isVisible('#insertAfter'), '#insertAfter button is shown');
  $('#insertAfter').trigger('click');
  ok(isVisible(newSubjectBox), 'Box for new subject is created');
  ok(isVisible('#editSubjectDialog'), 'Edit subject dialog is visible on addition of new subject');
  $('#newSubject').autotype('{{back}}BM');
  $('#newSubject').trigger('keyup');

  // Get the first subject for Monday
  equal($(firstMoSubject).html(), 'BM', "New subject text is BM");
  $('#subjectBgColor').val(pink).trigger('change');
  // Just to be consistent:
  $('#icp_subjectBgColor').css('background-color', pink);
  equal($(firstMoSubject).css('background-color'), pink, "New subject color is " + pink);
  $('#nobooks').prop('checked', false);
  $('#esdOK').trigger('click');
  ok(!isVisible('#editSubjectDialog'), 'Edit subject dialog is hidden after clicking OK');
  j = getScheduleObject(schedule);
  equal(j.dailySlots.Monday.length, 1, "1 subject after OK'ing add subject on Monday.");
  start();
});

asyncTest("'...' button is visible on mouse over subject slot", function() {
    var firstMoSubject = '#j0_1';
    expect(1);
    $(firstMoSubject).trigger('mouseover');
    ok(isVisible('#editSubject'), "'...' button is visible on mouse over subject slot");
    start();
});

asyncTest("Edit subject dialog appear when '...' button is clicked", function() {
    expect(3);
    $('#editSubject').trigger('click');
    ok(isVisible('#editSubjectDialog'), "Edit subject dialog appear when '...' buton is clicked");
    ok(isVisible('#esdOK'), "'OK' button in edit subject dialog is visible");
    ok(isVisible('#esdCancel'), "'Cancel' button in edit subject dialog is visible");
    start();
});

asyncTest("Edit subject dialog disappear when 'Cancel' button is clicked", function() {
    expect(1);
    $('#esdCancel').trigger('click');
    ok(!isVisible('#editSubjectDialog'), "Edit subject dialog is hidden when 'Cancel' buton is clicked");
    start();
});

asyncTest("Add before first subject", function() {
  var firstMoSubject = '#j0_1';
  expect(6);
  $(firstMoSubject).trigger('mouseover');
  ok(isVisible('#editOption'), "Edit option is visible on mouseover of first subject of Monday");
  $('#insertBefore').trigger('click');
  ok(!isVisible('#editOption'), "Edit option is not visible on clicking insert left button");
  ok(isVisible('#editSubjectDialog'), "Edit subject dialog is visible after clicking insert left button");
  // TODO Fix nobooks status when subject name is typed, currently when
  // subject name is empty we set nobooks = true, meaning that we assume
  // that empty subjects has no book.
  $('#editSubjectDialog #newSubject').autotype("{{back}}P");
  $('#nobooks').trigger('click');
  equals($('#nobooks').prop('checked'), true, 'No books checkbox is checked for P');
  $('#esdOK').trigger('click');
  j = getScheduleObject(schedule);
  equal(j.dailySlots.Monday[0].s, 'P', "Monday first subject is 'P'");
  // Get the new, emtpy first subject
  firstMoSubject = '#j0_1';
  equal($(firstMoSubject).html(), "P", "New subject is 'P'");
  start();
});

asyncTest("Add at end of Monday", function() {
  var secondMoSubject = '#j0_2',
      newlyAdded = '#j0_3'
  ;
  expect(5);
  // Get the original 'BM' subject, which is now 2nd (and last) subject for Monday
  $(secondMoSubject).trigger('mouseover');
  ok(isVisible('#editOption'), "Edit option is visible on mouseover of second subject of Monday");
  $('#insertAfter').trigger('click');
  equals($(newlyAdded).html(), '', "Default new subject name is ''");
  ok(!isVisible('#editOption'), "Edit option is not visible on clicking insert right button");
  ok(isVisible('#editSubjectDialog'), "Edit subject dialog is visible after clicking insert right button");
  $('#esdOK').trigger('click');
  ok(!isVisible('#editSubjectDialog'), "Edit subject dialog is hidden after clicking 'Cancel'");
  start();
});

asyncTest("Add two time slots", function() {
  expect(4);
  // Add 2nd time slot
  $('#time0').trigger('mouseover');
  ok(isVisible('#editOption'), "Edit option is visible on mouseover of first time slot");
  $('#insertAfter').trigger('click');
  equal(time.durations.length, 2, "Length of time array is now 2");
  // Add 3rd time slot
  $('#time1').trigger('mouseover');
  ok(isVisible('#editOption'), "Edit option is visible on mouseover of second time slot");
  $('#insertAfter').trigger('click');
  equal(time.durations.length, 3, "Length of time array is now 3");
  start();
});

asyncTest("Add and remove a time slot", function() {
  expect(4);
  // Add 4th time slot
  $('#time2').trigger('mouseover');
  ok(isVisible('#editOption'), "Edit option is visible on mouseover of third time slot");
  $('#insertAfter').trigger('click');
  equal(time.durations.length, 4, "Length of time array is now 4");
  $('#time3').trigger('mouseover');
  ok(isVisible('#editOption'), "Edit option is visible on mouseover of fourth time slot");
  $('#removeSlot').trigger('click');
  equal(time.durations.length, 3, "Length of time array after removing one slot is now 3");
  start();
});

asyncTest("Add and remove a subject slot", function() {
  var monday3rdSubject = $('#j0_3'),
      newlyAddedSubject
  ;
  expect(6);
  // Add Monday's 4th subject slot
  monday3rdSubject.trigger('mouseover');
  ok(isVisible('#editOption'), "Edit option is visible on mouseover of Monday's last subject");
  $('#insertAfter').trigger('click');
  j = getScheduleObject(schedule);
  equal(j.dailySlots.Monday.length, 4, "Length of Monday array is now 4");
  ok(isVisible('#editSubjectDialog'), "Edit subject dialog is visible after adding new subject");
  $('button#esdOK').trigger('click');
  ok(!isVisible('#editSubjectDialog'), "Edit subject dialog is not visible after clicking 'Cancel'");
  newlyAddedSubject = $('#j0_4');
  newlyAddedSubject.trigger('mouseover');
  ok(isVisible('#editOption'), "Edit option is visible on mouseover of Monday's (newly added) last subject");
  $('#removeSlot').trigger('click');
  j = getScheduleObject(schedule);
  equal(j.dailySlots.Monday.length, 3, "Length of Monday array is now back to 3");
  start();
});

asyncTest("Change duration of last time slot from 30 to 60", function() {
  var currentDurationShown,
      newDuration,
      expectedWidth
  ;
  expect(5);
  $('#time2').trigger('mouseover');
  ok(isVisible('#editOption'), "Edit option is visible on mouseover of first time slot");
  $('#editSubject').trigger('click');
  ok(isVisible('#editTimeDialog'), "Edit time dialog is shown after clicking '...' button");
  currentDurationShown = $('#newTimeDuration').val();
  newDuration = 40;
  equal(currentDurationShown, '30', "Current duration for 3rd time slot is 30");
  $('#newTimeDuration').autotype("{{back}}{{back}}40");
  expectedWidth = parseInt(schedule.timetable('durationToSize', 40), 10) + 'px';
  equal($('#time2').css('width'), expectedWidth,
      "first: 3rd time slot width is increased to " + expectedWidth);
  $('#etdOK').trigger('click');
  ok(!isVisible('#editOption'), "Edit time dialog is hidden after clicking ok");
  start();
});

asyncTest("Change duration of Monday's last subject from 30 to 60", function() {
  var mondayLastSubject,
      currentDurationShown,
      newDuration
  ;
  expect(5);
  mondayLastSubject = $('#j0_3');
  mondayLastSubject.trigger('mouseover');
  ok(isVisible('#editOption'), "Edit option is visible on mouseover of Monday's last subject");
  $('#editSubject').trigger('click');
  ok(isVisible('#editSubjectDialog'), "Edit subject dialog is shown after clicking '...' button");
  currentDurationShown = $('#newDuration').val();
  newDuration = 40;
  equal(currentDurationShown, 30, "Current duration for Monday's last subject 30");
  $('#newDuration').autotype("{{back}}{{back}}40");
  expectedWidth = parseInt(schedule.timetable('durationToSize', 40), 10) + 'px';
  equal(mondayLastSubject.css('width'), parseInt(schedule.timetable('durationToSize', 40), 10) + 'px',
      "second: 3rd time slot width is increased to", expectedWidth);
  $('#esdOK').trigger('click');
  ok(!isVisible('#editOption'), "Edit tsubject dialog is hidden after clicking ok");
  start();
});

asyncTest("Move left button is not visible on first time slot", function() {
    var timeSlotId = '#time0';
    expect(7);
    $(timeSlotId).trigger('mouseover');
    ok(isVisible('#editSubject'), 'editSubject button is shown');
    ok(isVisible('#removeSlot'), 'removeSlot button is shown');
    ok(isVisible('#insertBefore'), 'insertBefore button is shown');
    ok(isVisible('#insertAfter'), 'insertAfter button is shown');
    ok(!isVisible('#moveLeft'), 'moveLeft button is hidden');
    ok(isVisible('#moveRight'), 'moveRight button is shown');
    $(timeSlotId).trigger('mouseout');
    ok(!isVisible('#editOption'), 'Edit buttons container is hidden');
    start();
});

asyncTest("Move right button is not visible on last time slot", function() {
    var timeSlotId = '#time2';
    expect(7);
    $(timeSlotId).trigger('mouseover');
    ok(isVisible('#editSubject'), 'editSubject button is shown');
    ok(isVisible('#removeSlot'), 'removeSlot button is shown');
    ok(isVisible('#insertBefore'), 'insertBefore button is shown');
    ok(isVisible('#insertAfter'), 'insertAfter button is shown');
    ok(isVisible('#moveLeft'), 'moveLeft button is shown');
    ok(!isVisible('#moveRight'), 'moveRight button is hidden');
    $(timeSlotId).trigger('mouseout');
    ok(!isVisible('#editOption'), 'Edit buttons container is hidden');
    start();
});

asyncTest("Only insertAfter button is visible for day buttons", function() {
    var row, daySlotId;
    expect(49);
    for(row = 0; row < 7; row++) {
        daySlotId = '#j' + row + '_0';
        $(daySlotId).trigger('mouseover');
        ok(!isVisible('#editSubject'), 'editSubject button is hidden');
        ok(!isVisible('#removeSlot'), 'removeSlot button is hidden');
        ok(!isVisible('#insertBefore'), 'insertBefore button is hidden');
        ok(isVisible('#insertAfter'), 'insertAfter button is visible');
        ok(!isVisible('#moveLeft'), 'Move left button is hidden');
        ok(!isVisible('#moveRight'), 'moveRight button is hidden');
        $(daySlotId).trigger('mouseout');
        ok(!isVisible('#editOption'), 'Edit buttons container is hidden');
    }
    start();
});

asyncTest("Move right button is not visible on last subject on Monday", function() {
    var daySlotId = '#j0_3';
    expect(7);
    $(daySlotId).trigger('mouseover');
    ok(isVisible('#editSubject'), 'editSubject button is visible');
    ok(isVisible('#removeSlot'), 'removeSlot button is visible');
    ok(isVisible('#insertBefore'), 'insertBefore button is visible');
    ok(isVisible('#insertAfter'), 'insertAfter button is visible');
    ok(isVisible('#moveLeft'), 'Move left button is visible');
    ok(!isVisible('#moveRight'), 'moveRight button is hidden');
    $(daySlotId).trigger('mouseout');
    ok(!isVisible('#editOption'), 'Edit buttons container is hidden');
    start();
});

module("Day Compare");
asyncTest("Init day compare test", function() {
  var mondayBI,
      tuesdayBI,
      tuesdayBIwidth,
      tuesdayPS,
      tuesdayPSwidth
  ;
  expect(6);
  addTimeSlot(30);
  addSlotAfter(0, 3, 'BI', 30);
  addSlotAfter(1, 0, 'BI', 60);
  addSlotAfter(1, 1, 'PS', 70);
  mondayBI = '#j0_4';
  equal($(mondayBI).html(), 'BI', "New subject BI is added on Monday");
  equal($('#time3').html(), '09:20<br>09:50', "New added fourth time slot html is '09:20<br>09:50'");
  tuesdayBI = '#j1_1';
  equal($(tuesdayBI).html(), 'BI', "New subject BI is added on Tuesday");
  j = getScheduleObject(schedule);
  tuesdayBIwidth = parseInt(schedule.timetable('durationToSize', j.dailySlots.Tuesday[0].d), 10) + 'px';
  equal($(tuesdayBI).css('width'), tuesdayBIwidth, "Width of BI on Tuesday is correct");
  tuesdayPS = '#j1_2';
  equal($(tuesdayPS).html(), 'PS', "New subject PS is added after BI on Tuesday");
  tuesdayPSwidth = parseInt(schedule.timetable('durationToSize', j.dailySlots.Tuesday[1].d), 10) + 'px';
  equal($(tuesdayPS).css('width'), tuesdayPSwidth, "Width of PS on Tuesday is correct");
  start();
});

asyncTest("Day compare - Click '+' Day Flip Button (Forward Direction)", function() {
  var mondayButtonPrevious = $('#t0'),
      tuesdayButtonNext = $('#b1'),
      prev,
      next,
      previousDayButtonId,
      nextDayButtonId,
      prevButton,
      nextButton
  ;
  expect(16);
  mondayButtonPrevious.trigger('click');
  tuesdayButtonNext.trigger('click');

  for(i = 0; i <= 7; i++) {
      prev = i;
      next = i + 1;
      prev = prev % 7;
      next = next % 7;
      previousDayButtonId = '#t' + prev;
      nextDayButtonId = '#b' + next;
      prevButton = $(previousDayButtonId);
      nextButton = $(nextDayButtonId);

      ok(prevButton.hasClass('selected') == true && prevButton.html() == days[prev],
              "Previous button is " + days[prev] + " (left side) and it is selected.");
      ok(nextButton.hasClass('selected') == true && nextButton.html() == days[next],
              "Next button is " + days[next] + " (right side) and it is selected.");
      $('#nextButton').trigger('click');
  }

  start();
});

asyncTest("Day compare - Click '-' Day Flip Button (Reverse Direction)", function() {
  var mondayButtonPrevious = $('#t0'),
      tuesdayButtonNext = $('#b1'),
      Max,
      prev,
      next,
      previousDayButtonId,
      nextDayButtonId,
      prevButton,
      nextButton
  ;
  expect(16);
  mondayButtonPrevious.trigger('click');
  tuesdayButtonNext.trigger('click');

  Max = 7;
  for(i = 0; i <= 7; i++) {
      prev = (Max - i) % Max;
      next = (prev + 1) % Max;
      previousDayButtonId = '#t' + prev;
      nextDayButtonId = '#b' + next;
      prevButton = $(previousDayButtonId);
      nextButton = $(nextDayButtonId);

      ok(prevButton.hasClass('selected') == true && prevButton.html() == days[prev],
              "Previous button is " + days[prev] + " (left side) and it is selected.");
      ok(nextButton.hasClass('selected') == true && nextButton.html() == days[next],
              "Next button is " + days[next] + " (right side) and it is selected.");
      $('#prevButton').trigger('click');
  }

  start();
});

asyncTest("Day compare - Tuesday to Wednesday", function() {
  var tuesdayButtonPrevious = $('#t1'),
      wednesdayButtonNext = $('#b2'),
      putInList,
      takeOutList,
      firstSubject,
      secondSubject
  ;
  expect(4);
  tuesdayButtonPrevious.trigger('click');
  wednesdayButtonNext.trigger('click');

  putInList = $('#takein .boxee');
  equal(putInList.length, 0, "There is no subject in 'Put in' list");

  takeOutList = $('#takeout .boxee');
  equal(takeOutList.length, 2, "There are two subjects in 'Take out' list");
  firstSubject = $(takeOutList[0]);
  secondSubject = $(takeOutList[1]);
  equal(firstSubject.html() , 'BI', "Wednesday: Take out BI");
  equal(secondSubject.html(), 'PS', "Wednesday: Take out PS");

  start();
});

asyncTest("Day compare - Wednesday to Thursday", function() {
  expect(2);
  var wednesdayButtonPrevious = $('#t2');
  var thursdayButtonNext = $('#b3');
  wednesdayButtonPrevious.trigger('click');
  thursdayButtonNext.trigger('click');

  var putInList = $('#takein .boxee');
  equal(putInList.length, 0, "There is no subject in 'Put in' list");

  var takeOutList = $('#takeout .boxee');
  equal(takeOutList.length, 0, "There is no subjects in 'Take out' list");

  start();
});

asyncTest("Day compare - Sunday to Monday", function() {
  expect(4);
  var sundayButtonPrevious = $('#t6');
  var mondayButtonNext = $('#b0');
  sundayButtonPrevious.trigger('click');
  mondayButtonNext.trigger('click');

  var putInList = $('#takein .boxee');
  equal(putInList.length, 2, "There are two subjects in 'Put in' list");

  var takeOutList = $('#takeout .boxee');
  equal(takeOutList.length, 0, "There are no subjects in 'Take out' list");

  var firstSubject = $(putInList[0]);
  var secondSubject = $(putInList[1]);
  equal(firstSubject.html(), 'BM', "Sunday to Monday: Put in BM");
  equal(secondSubject.html(), 'BI', "Sunday to Monday: Put in BI");

  start();
});

asyncTest("Day compare - Monday to Tuesday (again, via '+' button)", function() {
  expect(4);
  $('#nextButton').trigger('click');

  var putInList = $('#takein .boxee');
  equal(putInList.length, 1, "There is one subject in 'Put in' list");
  var theSubject = $(putInList[0]);
  equal(theSubject.html(), 'PS', "Tuesday: Put in PS");

  var takeOutList = $('#takeout .boxee');
  equal(takeOutList.length, 1, "There is one subject in 'Take out' list");
  var theSubject = $(takeOutList[0]);
  equal(theSubject.html(), 'BM', "Tuesday: Take out BM");

  start();
});

asyncTest("Change start hour from 7 to 8", function() {
    expect(6);
    equal($('#startHour').val(), '7', 'Current start hour is 7');
    $('#startHour').val('8').trigger('change');
    equal($('#startHour').val(), '8', 'Start hour is changed to 8');
    equal($('#time0').html(), '08:40<br>09:10', 'time0 is 08:40 to 09:10');
    equal($('#time1').html(), '09:10<br>09:40', 'time1 is 09:10 to 09:40');
    equal($('#time2').html(), '09:40<br>10:20', 'time2 is 09:40 to 10:20');
    equal($('#time3').html(), '10:20<br>10:50', 'time3 is 10:20 to 10:50');
    start();
});

asyncTest("Change start minute from 40 to 00", function() {
    expect(6);
    var newValue = '00';
    equal($('#startMinute').val(), '40', 'Current start minute is 40');
    $('#startMinute').val(newValue).trigger('change');
    equal($('#startMinute').val(), newValue, 'Start minute is changed to ' + newValue);
    equal($('#time0').html(), '08:00<br>08:30', 'time0 is 08:00 to 08:30');
    equal($('#time1').html(), '08:30<br>09:00', 'time1 is 08:30 to 09:00');
    equal($('#time2').html(), '09:00<br>09:40', 'time2 is 09:00 to 09:40');
    equal($('#time3').html(), '09:40<br>10:10', 'time3 is 09:40 to 10:10');
    start();
});

asyncTest("Move subject left", function() {
    expect(4);
    equals($('#j0_1').html(), 'P', "1st subject Monday is 'P'");
    equals($('#j0_2').html(), 'BM', "2nd subject Monday is 'BM'");
    $('#j0_2').trigger('mouseover');
    $('#moveLeft').trigger('click');
    equals($('#j0_1').html(), 'BM', "1st subject Monday is 'BM'");
    equals($('#j0_2').html(), 'P', "2nd subject Monday is 'P'");
    start();
});

asyncTest("Move subject right", function() {
    expect(4);
    equals($('#j0_1').html(), 'BM', "1st subject Monday is 'BM'");
    equals($('#j0_2').html(), 'P', "2nd subject Monday is 'P'");
    $('#j0_1').trigger('mouseover');
    $('#moveRight').trigger('click');
    equals($('#j0_1').html(), 'P', "1st subject Monday is 'P'");
    equals($('#j0_2').html(), 'BM', "2nd subject Monday is 'BM'");
    start();
});

asyncTest("Move time left", function() {
    expect(4);
    equals($('#time1').html(), '08:30<br>09:00', "2nd time is 08:30 to 09:00");
    equals($('#time2').html(), '09:00<br>09:40', "3rd time is 09:00 to 09:40");
    $('#time2').trigger('mouseover');
    $('#moveLeft').trigger('click');
    equals($('#time1').html(), '08:30<br>09:10', "2nd time is 08:30 to 09:10");
    equals($('#time2').html(), '09:10<br>09:40', "3rd time is 09:10 to 09:40");
    start();
});

asyncTest("Move time right", function() {
    expect(4);
    equals($('#time1').html(), '08:30<br>09:10', "2nd time is 08:30 to 09:10");
    equals($('#time2').html(), '09:10<br>09:40', "3rd time is 09:10 to 09:40");
    $('#time1').trigger('mouseover');
    $('#moveRight').trigger('click');
    equals($('#time1').html(), '08:30<br>09:00', "2nd time is 08:30 to 09:00");
    equals($('#time2').html(), '09:00<br>09:40', "3rd time is 09:00 to 09:40");
    start();
});

asyncTest("Retain selected next and prev buttons on start day change", function() {
    var takein,
        takeout,
        prev = $('#t0'),
        next = $('#b1'),
        dayName
    ;

    expect(110);

    equals(prev.html(), 'Monday', "Previous selected is Monday");
    equals(next.html(), 'Tuesday', "Next selected is Tuesday");

    prev.trigger('click');
    next.trigger('click');

    takein = $('#takein .boxee');
    equals(takein.size(), 1, 'Only one subject in take in box');
    equals(takein.html(), 'PS', 'That subject is PS');
    takeout = $('#takeout .boxee');
    equals(takeout.size(), 1, 'Only one subject in take out box');
    equals(takeout.html(), 'BM', 'That subject is BM');

    // Start day change forward Monday -> Sunday
    for(i = 1; i < days.length; i++) {
        dayName = days[i];
        $('#startDay').val(days[i]).trigger('change');
        prev = $('#compareContainer1 button.selected');
        next = $('#compareContainer2 button.selected');
        equals(prev.size(), 1, 'Only one previous button is selected');
        equals($(prev[0]).html(), 'Monday', 'That button is Monday');
        equals(next.size(), 1, 'Only one next button is selected');
        equals($(next[0]).html(), 'Tuesday', 'That button is Tuesday');
        takein = $('#takein .boxee');
        equals(takein.size(), 1, 'Only one subject in take in box');
        equals(takein.html(), 'PS', 'That subject is PS');
        takeout = $('#takeout .boxee');
        equals(takeout.size(), 1, 'Only one subject in take out box');
        equals(takeout.html(), 'BM', 'That subject is BM');
    }

    // Start day change backward Sunday -> Monday
    for(i = 6; i >= 0; i--) {
        dayName = days[i];
        $('#startDay').val(days[i]).trigger('change');
        prev = $('#compareContainer1 button.selected');
        next = $('#compareContainer2 button.selected');
        equals(prev.size(), 1, 'Only one previous button is selected');
        equals($(prev[0]).html(), 'Monday', 'That button is Monday');
        equals(next.size(), 1, 'Only one next button is selected');
        equals($(next[0]).html(), 'Tuesday', 'That button is Tuesday');
        takein = $('#takein .boxee');
        equals(takein.size(), 1, 'Only one subject in take in box');
        equals(takein.html(), 'PS', 'That subject is PS');
        takeout = $('#takeout .boxee');
        equals(takeout.size(), 1, 'Only one subject in take out box');
        equals(takeout.html(), 'BM', 'That subject is BM');
    }


    start();
});

asyncTest("Serialize", function() {
    var j = getScheduleObject(schedule),
        expectedTopLevelKeys = { time:1, dailySlots:1, startDay: 1, bgColor:1, booksFor:1, pixel_per_minute:1 },
        keyCount = 0,
        firstSubjectMonday = j.dailySlots.Monday[0],
        monday = j.startDay,
        expectedKeys = { s:1, d:1, c:1, nobook:1 },
        i, k, row, slot,
	dayName,
        key;

    expect(29);

    for (key in j) {
        keyCount += 1;
        ok(expectedTopLevelKeys[key], key + " is one of allowed toplevel keys in j");
    }
    console.log(j);
    equals(keyCount, 6, "There are exactly six entries in j after serialization");

    ok(firstSubjectMonday.nobook == 1, ".nobook exists after serialization");
    ok(firstSubjectMonday.s == 'P', ".s exists after serialization");
    ok(firstSubjectMonday.d == '30', ".d exists after serialization");

    ok(monday == 'Monday', ".startDay exists after serialization");

    for (dayName in j.dailySlots) {
        row = j.dailySlots[dayName];
        for (k = 0; k < row.length; k++) {
            slot = row[k]
            for(key in slot) {
                ok(expectedKeys[key], key + " is one of allowed slot keys");
            }
        }
    }
    start();
});

asyncTest("Add time", function() {
    expect(1);
    $('#newduration').val('300');
    $('button#addduration').trigger('click');
    equals($('#time4').html(), '10:10<br>15:10', "New time added using quick widget is correct");
    start();
});

asyncTest("Quick add time button is disabled when edit subject dialog is shown", function() {
    var mondayFirst = '#j0_1';
    expect(10);
    $(mondayFirst).trigger('mouseover');
    ok(isVisible('#editSubject'), "Edit subject button in edit subject widget is visible");
    $('#editSubject').trigger('click');
    ok(isVisible('#editSubjectDialog'), "Edit subject dialog is visible");
    equals($('#addduration').attr('disabled'), 'disabled',
        "Quick add duration button must be disabled when edit subject dialog appears");
    $('#esdCancel').trigger('click');
    ok(!isVisible('#editSubjectDialog'), "Edit subject dialog is not visible");
    equals($('#addduration').attr('disabled'), undefined,
        "Quick add duration button must be enabled after esdCancel button is clicked");

    $(mondayFirst).trigger('mouseover');
    ok(isVisible('#editSubject'), "2. Edit subject button in edit subject widget is visible");
    $('#editSubject').trigger('click');
    ok(isVisible('#editSubjectDialog'), "2. Edit subject dialog is visible");
    equals($('#addduration').attr('disabled'), 'disabled',
        "2. Quick add duration button must be disabled when edit subject dialog appears");
    $('#esdOK').trigger('click');
    ok(!isVisible('#editSubjectDialog'), "2. Edit subject dialog is not visible");
    equals($('#addduration').attr('disabled'), undefined,
        "Quick add duration button must be enabled after esdOK button is clicked");
    start();
});

asyncTest("Quick add time button is disabled when edit time dialog is shown", function() {
    var timeFirst = '#time0';
    expect(10);
    $(timeFirst).trigger('mouseover');
    ok(isVisible('#editSubject'), "Edit time button in edit subject widget is visible");
    $('#editSubject').trigger('click');
    ok(isVisible('#editTimeDialog'), "Edit time dialog is visible");
    equals($('#addduration').attr('disabled'), 'disabled',
        "2. Quick add duration button must be disabled when edit time dialog appears");
    $('#etdCancel').trigger('click');
    ok(!isVisible('#editTimeDialog'), "Edit time dialog is not visible");
    equals($('#addduration').attr('disabled'), undefined,
        "Quick add duration button must be enabled after etdCancel button is clicked");

    $(timeFirst).trigger('mouseover');
    ok(isVisible('#editSubject'), "2. Edit time button in edit subject widget is visible");
    $('#editSubject').trigger('click');
    ok(isVisible('#editTimeDialog'), "2. Edit time dialog is visible");
    equals($('#addduration').attr('disabled'), 'disabled',
        "2. Quick add duration button must be disabled when edit time dialog appears");
    $('#etdOK').trigger('click');
    ok(!isVisible('#editTimeDialog'), "2. Edit time dialog is not visible");
    equals($('#addduration').attr('disabled'), undefined,
        "Quick add duration button must be enabled after etdOK button is clicked");
    start();
});

module("Subject and time slots alignment");
asyncTest("Slot width", function() {
    var secondSixty = '#j0_2',
        thirdTime = '#time2'
    ;

    expect(1);
    schedule.timetable({
        schedule: {
            time: {
                start: {
                            hour: 7,
                        minute: 40
                },
                durations: [ 30, 30, 60, 70, 70, 70, 70  ]
            },
            dailySlots: {
                Monday: [
                    { s:'1st 60', d:60 },
                    { s:'2nd 60', d:60 }
                ],
            }
        },
        edit: true
    });
    schedule.timetable('rerender');

    equals($(secondSixty).offset().left, $(thirdTime).offset().left, "Second subject aligns with start of third time slot");
    start();
});

module("Reinitialization");
asyncTest("Reinitialize with no option", function() {
    expect(1);
    schedule.timetable();
    schedule.timetable('rerender');
    equals($('#adddurationc').size(), 0, "#adddurationc (Quick add duration widget) does not exists");
    start();
});

asyncTest("Reinitialize with only edit option", function() {
    expect(1);
    schedule.timetable( { edit: true } );
    schedule.timetable('rerender');
    ok(isVisible('#adddurationc'), "Quick add duration widget is shown");
    start();
});

module("Books");
asyncTest("Setup", function() {
    var dailySlots;
    expect(2);
    $('#j0_0').trigger('mouseover');
    $('#insertAfter').trigger('click');
    $('#newSubject').autotype('M');
    $('#esdOK').trigger('click');

    $('#j4_0').trigger('mouseover');
    $('#insertAfter').trigger('click');
    $('#newSubject').autotype('F');
    $('#esdOK').trigger('click');

    dailySlots = getScheduleObject(schedule).dailySlots;
    equals(dailySlots.Monday[0].s, 'M', "First Monday subject is M");
    equals(dailySlots.Friday[0].s, 'F', "First Friday subject is F");
    start();
});

asyncTest("Add book dialog visibility and overlay", function() {
    var M = '#j0_1';
    expect(9);
    $(M).trigger('mouseover');
    ok(isVisible('#editWidget'), "Edit widget is visible");
    $(isVisible('#editSubject'), "Edit subject button is visible");
    $('#editSubject').trigger('click');
    ok(isVisible('#editSubjectDialog'), "Edit subject dialog is visible");
    ok(isVisible('#addbooks'), "Add books button is visible");
    $('#addbooks').trigger('click');
    ok(isVisible('#addBookDialog'), "Add book dialog is visible");
    ok(isVisible('#overlay'), "Overlay is visible ...");
    deepEqual($('#overlay').offset(), $('#editSubjectDialog').offset(),
        "and it is covering editSubjectDialog");
    $('#addBookCancel').trigger('click');
    ok(!isVisible('#overlay'), "Overlay is hidden");
    ok(!isVisible('#addBookDialog'), "Add book dialog is hidden");
    $('#esdCancel').trigger('click');
    ok(!isVisible('#editSubjectDialog'), "Edit subject dialog is now hidden");
    start();
});

asyncTest("nobook is set for subject with no name", function() {
    var dailySlots;
    expect(1);
    $('#j2_0').trigger('mouseover');
    $('#insertAfter').trigger('click');
    $('#newSubject').autotype('{{back}}');
    $('#esdOK').trigger('click');
    dailySlots = getScheduleObject(schedule).dailySlots;
    equals(dailySlots.Wednesday[0].nobook, true, "nobook flag for Wednesday first subject is set");
    start();
});

asyncTest("Add book, then Cancel functionality", function() {
    var M = '#j0_1';
    expect(8);
    $(M).trigger('mouseover');
    ok(isVisible('#editWidget'), "addbook: Edit widget is visible");
    $(isVisible('#editSubject'), "addbook: Edit subject button is visible");
    $('#editSubject').trigger('click');
    ok(isVisible('#editSubjectDialog'), "addbook: Edit subject dialog is visible");
    ok(isVisible('#addbooks'), "addbook: Add books button is visible");
    $('#addbooks').trigger('click');
    ok(isVisible('#addBookDialog'), "addbook: Add book dialog is visible");

    $('#bookname').autotype('{{back}}M Book 1');
    $('#addbook').trigger('click');

    $('#addBookCancel').trigger('click');
    ok(!isVisible('#overlay'), "Overlay is hidden");
    ok(!isVisible('#addBookDialog'), "Add book dialog is hidden");
    $('#esdCancel').trigger('click');
    ok(!isVisible('#editSubjectDialog'), "Edit subject dialog is now hidden");

    equals(schedule.timetable('getBooksFor', {s:'M'}).length, 0, "No book added for M");

    start();
});

asyncTest("Add book, then OK functionality", function() {
    var M = '#j0_1';
    expect(10);
    $(M).trigger('mouseover');
    ok(isVisible('#editWidget'), "addbook: Edit widget is visible");
    $(isVisible('#editSubject'), "addbook: Edit subject button is visible");
    $('#editSubject').trigger('click');
    ok(isVisible('#editSubjectDialog'), "addbook: Edit subject dialog is visible");
    ok(isVisible('#addbooks'), "addbook: Add books button is visible");
    $('#addbooks').trigger('click');
    ok(isVisible('#addBookDialog'), "addbook: Add book dialog is visible");

    $('#bookname').val('M aBook 1');
    $('#addbook').trigger('click');

    $('#addBookOk').trigger('click');
    ok(!isVisible('#overlay'), "Overlay is hidden");
    ok(!isVisible('#addBookDialog'), "Add book dialog is hidden");
    $('#esdOK').trigger('click');
    ok(!isVisible('#editSubjectDialog'), "Edit subject dialog is now hidden");

    equals(schedule.timetable('getBooksFor', {s:'M'}).length, 1, "1 book added for M");
    equals(schedule.timetable('getBooksFor', {s:'M'})[0], 'M aBook 1', "That book is 'M aBook 1'");
    equals(schedule.timetable('getBooksFor', {s:'F'}).length, 0, "No book added for F");

    start();
});

asyncTest("Monday->Tuesday M ABook 1 must be in take out list", function() {
    expect(4);
    $('#t0').trigger('click');
    $('#b1').trigger('click');
    ok(isVisible('#inoutbook', "In out book table is shown"));
    equals($('#inoutbook tr').size(), 3, "It has 3 rows");
    equals($('#inoutbook tr:last td:last div:first').html(),
        'M aBook 1', "M aBook 1 is shown in out list for Tuesday");
    equals($('#inoutbook tr:last td:first').html(), '&nbsp;',
        "No book to be put in for Tuesday");
    start();
});

asyncTest("Tuesday->Monday M ABook 1 must be in put in list", function() {
    expect(4);
    $('#t1').trigger('click');
    $('#b0').trigger('click');
    ok(isVisible('#inoutbook', "In out book table is shown"));
    equals($('#inoutbook tr').size(), 3, "It has 3 rows");
    equals($($('#inoutbook tr:last td div')[1]).html(),
        'M aBook 1', "M aBook 1 is shown in put in list for Monday");
    equals($('#inoutbook tr:last td').size(), 2,
        "No book to be taken out for Monday");
    start();
});

asyncTest("Add M on Wednesday with text book set to not use.", function() {
    expect(4);
    $('#j2_1').trigger('mouseover');
    $('#insertAfter').trigger('click');
    $('#newSubject').autotype('{{back}}M');
    $('#addbooks').trigger('click');

    equals($('#bookUseHere_0').prop('checked'), true,
        "Need to use 'M aBook 1' here is set (assumed)");
    $('#bookUseHere_0').trigger('click');
    equals($('#bookUseHere_0').prop('checked'), false,
        "Use here checkbox is now unset");
    $('#addBookOk').trigger('click');
    $('#esdOK').trigger('click');
    j = getScheduleObject(schedule).dailySlots;
    equals(j.Monday[0].books['M aBook 1'], true,
        "'M aBook 1' is used on Monday");
    equals(j.Wednesday[1].books['M aBook 1'], false,
        "'M aBook 1' is not used on Wednesday");
    start();
});

asyncTest("Wednesday->Monday 'M aBook 1' must be the only one in take in list", function() {
    expect(5);
    selectPrev('Wednesday');
    selectNext('Monday');
    ok(isVisible('#inoutbook', "use here: In out book table is shown"));
    ok($('#inoutbook').html() != '', "use here: In out book table is not empty");
    equals($('#inoutbook tr').size(), 3, "use here: In out book table has 3 rows");
    equals($($('#inoutbook tr:last td div')[1]).html(),
        'M aBook 1', "use here: M aBook 1 is shown in put in list for Monday");
    equals($('#inoutbook tr:last td').size(), 2,
        "No book to be taken out for Monday");
    start();
});

asyncTest("Monday->Wednesday 'M aBook 1' must be the only one in take out list", function() {
    var divs, tds;
    expect(6);
    selectPrev('Monday');
    selectNext('Wednesday');
    ok(isVisible('#inoutbook', "use here M->W: In out book table is shown"));
    ok($('#inoutbook').html() != '', "use here M->W: In out book table is not empty");
    equals($('#inoutbook tr').size(), 3, "use here M->W: In out book table has 3 rows");
    divs = $('#inoutbook tr:last td div');
    equals(divs.size(), 2, "There are ony two divs in in out book table");
    equals($(divs[1]).html(), 'M aBook 1',
        "use here M->W: M aBook 1 is shown in put out list for Monday");

    tds = $('#inoutbook tr:last td');
    equals($(tds[0]).html() + $(tds[1]).html(), '&nbsp;&nbsp;',
        "No book to be taken in for Monday");
    start();
});

asyncTest("Add Common Book to subject M, ensure that existing status in other slot not affected", function() {
    expect(2);
    addBookToSlot(0, 1, 'M Common');
    editSubject(2, 2);
    clickBooksButton();
    equals(getCheckBoxStatus('#bookUseHere_0'), false, "M Book 1 is not used here");
    equals(getCheckBoxStatus('#bookUseHere_1'),  true, "M Common is used here");
    clickAddBookCancelButton();
    clickEditSubjectDialogCancelButton();
    start();
});

asyncTest("Monday->Wednesday: Common Book should not be taken out or in", function() {
    var divs,
        tds,
        tag = 'use here with common book M->W: ';
    expect(5);
    selectPrev('Monday');
    selectNext('Wednesday');
    ok(isVisible('#inoutbook', tag + "In out book table is shown"));
    ok($('#inoutbook').html() != '', tag + "In out book table is not empty");
    equals($('#inoutbook tr').size(), 3, tag + "In out book table has 3 rows");
    divs = $('#inoutbook div');
    equals(divs.size(), 2, tag + "Only one boxee and one book is shown");
    equals($(divs[1]).html(), 'M aBook 1', tag + "That book is 'M aBook 1'");
    start();
});

asyncTest("Wednesday->Thursday: Only Common Book should be taken out", function() {
    var divs,
        tds,
        tag = 'use here with common book W->T: ';
    expect(5);
    selectPrev('Wednesday');
    selectNext('Thursday');
    ok(isVisible('#inoutbook', tag + "In out book table is shown"));
    ok($('#inoutbook').html() != '', tag + "In out book table is not empty");
    equals($('#inoutbook tr').size(), 3, tag + "In out book table has 3 rows");
    divs = $('#inoutbook div');
    equals(divs.size(), 2, tag + "Only one boxee and one book is shown");
    equals($(divs[1]).html(), 'M Common', tag + "That book is 'M Common'");
    start();
});

asyncTest("Monday->Friday No book flag set on subject that has books", function() {
    var divs,
        tds,
        tag = 'nobook flag set M->F: ';
    expect(6);
    addSlotAfter(4, 1, 'M');
    editSubject(4, 2);
    setCheckBoxStatus('#nobooks', true);
    clickEditSubjectDialogOKButton();
    selectPrev('Monday');
    selectNext('Friday');
    ok(isVisible('#inoutbook', tag + "In out book table is shown"));
    ok($('#inoutbook').html() != '', tag + "In out book table is not empty");
    equals($('#inoutbook tr').size(), 3, tag + "In out book table has 4 rows");
    divs = $('#inoutbook tr:last div');
    equals(divs.size(), 4, tag + "Two boxees and two book names are shown");
    equals($(divs[2]).html(), 'M aBook 1');
    equals($(divs[3]).html(), 'M Common');
    start();
});

asyncTest("Friday->Monday No book flag set on subject that has books", function() {
    var divs,
        tds,
        tag = 'nobook flag set F->M: ';
    expect(11);
    selectPrev('Friday');
    selectNext('Monday');
    ok(isVisible('#inoutbook', tag + "In out book table is shown"));
    ok($('#inoutbook').html() != '', tag + "In out book table is not empty");
    equals($('#inoutbook tr').size(), 3, tag + "In out book table has 4 rows");
    divs = $('#inoutbook tr:last div');
    equals(divs.size(), 4, tag + "Two boxees and two book names are shown");
    divs = $('#inoutbook tr:last td:first div');
    equals(divs.size(), 1);
    equals($(divs).html(), 'M', 'The only "In" subject shown is M');
    divs = $('#inoutbook tr:last td div');
    equals(divs.size(), 4);
    equals($(divs[0]).html(), 'M', 'boxee');
    equals($(divs[1]).html(), 'M aBook 1');
    equals($(divs[2]).html(), 'M Common');
    equals($(divs[3]).html(), 'F', 'boxee');
    start();
});

asyncTest("Click add when no book is entered", function() {
    var takeout;
    expect(2);
    schedule.timetable({
		schedule: {
		    time: {
			start: {
			    hour: 7,
			    minute: 40
			},
			durations: [ 30, 30 ]
		    },
		    dailySlots: {
			Monday: [
			    { s: 'A', d: 30 }
			]
		    }
		},
		edit: true
	    }
    );
    schedule.timetable('rerender');
    editSubject(0, 1);
    clickBooksButton();
    clickAddBookButton();
    clickAddBookOKButton();
    clickEditSubjectDialogOKButton();
    selectPrev('Monday');
    selectNext('Tuesday');

    takeout = $('#takeout .boxee');
    equals(takeout.size(), 1, 'Only one subject in take out box');
    equals(takeout.html(), 'A', 'That subject is A');
    start();
});

asyncTest("Cancelling add book, then cancelling edit subject should not modify subject", function() {
    expect(1);
    editSubject(0, 1);
    $('#newSubject').val('AA');
    clickBooksButton();
    clickAddBookButton();
    clickAddBookCancelButton();
    clickEditSubjectDialogCancelButton();
    equals($('#j0_1').html(), 'A', "Subject A is not modified");
    start();
});

asyncTest("Subject name must not be modified after esdCancel after books is added", function() {
    var takeout;
    expect(1);
    editSubject(0, 1);
    $('#newSubject').val('Aee');
    clickBooksButton();
    clickAddBookButton();
    $('input#bookname').val('Aee Book 1');
    clickAddBookOKButton();
    clickEditSubjectDialogCancelButton();
    equals($('#j0_1').html(), 'A', "Subject A must not be modified");
    start();
});

module("Reinitialize with startDay");
asyncTest("Start day is Sunday", function() {
    var sched = {
        time: { start: { hour: 7, minute: 40 }, durations: [ 30, 30, 30 ] },
        dailySlots: {
          Monday: [
            { s: 'PE', d: 30 },
            { s: 'ME', d: 60 }
          ],
          Wednesday: [
            { s: 'ME', d: 70 },
            { s: 'PE', d: 20 }
          ],
          Friday: [
            { s: 'AI', d: 30 },
            { s: '', d: 30 },
            { s: 'AE', d: 30 }
          ]
        },
        bgColor: {
          ME: 'pink',
          PE: 'lightblue',
          AI: 'lightgreen',
          AE: 'lightyellow'
        },
        startDay: 'Friday'
    };
    expect(1);
    schedule.timetable({ schedule: sched, edit: true });
    schedule.timetable('render');
    equals($('#j0_0').html(), 'Fr', "Start day is Friday");
    start();
});

});

<!-- vim:set fdm=marker foldmarker=asyncTest(,});: -->
