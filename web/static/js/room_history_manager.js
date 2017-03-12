import * as utils from "./utils"
import * as cc from "./chat_channel"

const start_conversation = `<li class="start color-info-font-color">${gettext.start_of_conversation}</li>`
const container = '.messages-box .wrapper ul'
const wrapper = '.messages-box .wrapper'
const debug = true

class RoomHistoryManager {
  constructor() {
    this.is_loading = false
    this.has_more = false
    this.has_more_next = false
    if ($(container).has('li.load-more').length > 0)
      this.has_more = true
  }
  get isLoading()   { return this.is_loading }
  get hasMore()     { return this.has_more }
  get hasMoreNext() { return this.has_more_next }

  set setHasMoreNext(on) {
    if (on) {
      $(wrapper).addClass('has-more-next')
      $('.jump-recent').removeClass('not')
    } else {
      $(wrapper).removeClass('has-more-next')
      $('.jump-recent').addClass('not')
    }
  }

  get getMore() {
    if (debug) { console.log('roomHistoryManager.getMore()')}
    // this.updateMentionsMarksOfRoom()
    let html = $('.messages-box .wrapper ul').html()
    let first_id = $('.messages-box .wrapper ul li[id]').first().attr('id')

    this.is_loading = true

    utils.page_loading()
    this.startGetMoreAnimation()

    cc.get('/messages', {timestamp: $('li.message').first().attr('data-timestamp')})
      .receive("ok", resp => {
        if (debug) { console.log('got response back from loading', resp) }

        $(container)[0].innerHTML = resp.html + html

        if (debug) { console.log('finished loading', first_id) }

        this.startGetMoreAnimation()

        scroll_to($('#' + first_id), -80)
        utils.remove_page_loading()

        if (!resp.has_more) {
          $(container).children().first().addClass('new-day')
          $(container).prepend(start_conversation)
        } else {
          $('li.load-more').remove()
          $(container).prepend(utils.loadmore())
        }
        this.is_loading = false
        this.has_more = resp.has_more
      })
  }
  get getMoreNext() {
    let html = $(container).html()
    let ts = $('.messages-box li[data-timestamp]').last().data('timestamp')
    let last_id = $('.messages-box li[data-timestamp]').last().attr('id')
    utils.page_loading()
    this.startGetMoreNextAnimation()
    this.is_loading = true

    cc.get('/messages/previous', {timestamp: ts})
      .receive("ok", resp => {
        if (debug) { console.log('getMoreNext resp', resp)}
        $('.messages-box .wrapper ul li:last.load-more').addClass('load-more-next')
        $('.messages-box .wrapper ul')[0].innerHTML = html + resp.html

        scroll_to($('#' + last_id), 400)
        $('.load-more-next').remove()
        if (resp.has_more_next) {
          this.setHasMoreNext = true
          $('.messages-box .wrapper ul').append(utils.loadmore())
        } else {
          this.setHasMoreNext = false
        }

        this.is_loading = false
        this.has_more_next = resp.has_more_next
      })
  }

  getSurroundingMessages(timestamp) {
    console.log("jump-to need to load some messages", timestamp)
    this.is_loading = true
    utils.page_loading()
    $('.messages-box .wrapper ul li.load-more').html(utils.loading_animation())
    cc.get('/messages/surrounding', {timestamp: timestamp})
      .receive("ok", resp => {
        $(container)[0].innerHTML = resp.html
        let message_id = $(`.messages-box li[data-timestamp="${timestamp}"]`).attr('id')
        scroll_to($('#' + message_id), -200)
        if (resp.has_more_next) {
          this.setHasMoreNext = true
          $('.messages-box .wrapper ul:last').append(utils.loadmore())
        } else {
          this.setHasMoreNext = false
        }
        if (resp.has_more) {
          $('.messages-box .wrapper ul').prepend(utils.loadmore())
        }
        utils.remove_page_loading()
        this.has_more_next = resp.has_more_next
        this.has_more = resp.has_more
        this.is_loading = false
      })
  }

  getRecent() {
    utils.page_loading()
    $(container).prepend(utils.loadmore_with_animation())
    utils.page_loading()
    this.is_loading = true

    cc.get('/messages/last')
      .receive("ok", resp => {
        $('.messages-box .wrapper ul')[0].innerHTML = resp.html
        $(container + ' li:first.load-more').remove()
        $('.messages-box .wrapper').animate({
          scrollTop: utils.getScrollBottom()
        }, 1000);
        this.setHasMoreNext = false
        this.has_more_next = false
        this.has_more = true
        this.is_loading = false
      })
  }

  startGetMoreAnimation() {
    $('.messages-box .wrapper ul li:first.load-more').html(utils.loading_animation())
  }
  startGetMoreNextAnimation() {
    this.removeGetMoreNextAnimation()
    $(container).append(utils.loadmore_with_animation())
  }
  removeGetMoreNextAnimation() {
    $('.messages-box .wrapper ul > li:first.load-more').remove()
  }
  removeGetMoreNextAnimation() {
    $('.messages-box .wrapper ul > li:last.load-more').remove()
  }
}

export default RoomHistoryManager

