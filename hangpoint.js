(function(exports) {
  "use strict";

  var $ = exports.$,

      // id of the current participant
      myID,

      // google hangout participants objects
      participants = [],

      // key: the particpant id
      // value: the points
      all_points = {},

      // whether or not to show other people's points
      show_points = false,

      // DOM ELEMENTS
      $table, $buttons, $reveal, $hide, $clear

  function getDomElements() {
    $table   = $('table#participants')
    $buttons = $('#vote button')
    $reveal  = $('#reveal')
    $hide    = $('#hide')
    $clear   = $('#clear')
  }

  function render() {
    if (!$table) return;
    $table.html('')
    $(participants).each(function(i,participant) {
          // points for current participant (can be empty)
      var points = all_points['points_'+participant.id],
          $row = $('<tr/>'),
          // determine label to show (i.e. show points or a special character?)
          // ... : no vote
          // ?   : hidden vote
          // N   : shown vote
          label = (points ? (show_points ? points : '?') : '&hellip;'),
          $name = $('<th/>',{text: participant.person.displayName}),
          $vote = $('<td/>',{
            html: (participant.id == myID && points ? points : label)})
      $row.append($name)
      $row.append($vote)
      $table.append($row)
    })
  }

  function handleEnabledParticipantsChanged(e) {
    participants = e.enabledParticipants
    render()
  }

  function attachListeners() {
    $buttons.on('click', handleVote)
    $reveal. on('click', handleReveal)
    $hide.   on('click', handleHide)
    $clear.  on('click', handleClear)
  }

  function handleReveal(e) {
    updateState({show_points: true})
  }

  function handleHide(e) {
    updateState({show_points: false})
  }

  function handleClear(e) {
    var state = gapi.hangout.data.getState()
    for(var k in state) {
      if (k.substring(0,7) == 'points_') {
        all_points[k] = null
      }
    }
    updateState({
      all_points: all_points,
      show_points: false
    })
  }

  function handleVote(e) {
    var $button = $(e.currentTarget),
        point = parseInt($button.text())
    updateState({my_points: point})
  }

  function handleState(e) {
    var value, state = e.state
    for(var k in state) {
      value = JSON.parse(state[k])
      if (k == 'show_points') {
        show_points = value
        if (value) {
          $reveal.prop('checked',true)
          $hide.prop('checked',false)
        } else {
          $reveal.prop('checked',false)
          $hide.prop('checked',true)
        }
      } else if (k.substring(0,7) == 'points_') {
        all_points[k] = value
      }
    }
    render()
  }

  function updateState(options) {
    var delta = {}, options = options || {}

    // send personal points
    if (options['my_points']) {
      delta['points_'+myID] = JSON.stringify(options['my_points'])
    }

    // send all points
    if (options['all_points']) {
      for(var k in all_points) {
        delta[k] = JSON.stringify(all_points[k])
      }
    }

    // send whether to show points or not
    if (options.hasOwnProperty('show_points')) {
      delta['show_points'] = JSON.stringify(options['show_points'])
    }

    gapi.hangout.data.submitDelta(delta)
  }

  if (gapi && gapi.hangout) {
    gapi.hangout.data.onStateChanged.add(handleState)
    gapi.hangout.onEnabledParticipantsChanged.add(handleEnabledParticipantsChanged)
    gapi.hangout.onApiReady.add(function(apiInitEvent) {
      myID = gapi.hangout.getLocalParticipantId()
      getDomElements()
      handleEnabledParticipantsChanged({
        enabledParticipants: gapi.hangout.getEnabledParticipants()
      })
      handleState({
        state: gapi.hangout.data.getState()
      })
      attachListeners()
      render()
    })
  }

})(this)