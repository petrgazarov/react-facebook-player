import React from 'react';
import { string, number, func } from 'prop-types';

class FacebookPlayer extends React.Component {
  static propTypes = {
    id: string,
    className: string,
    appId: string.isRequired,
    videoId: string.isRequired,
    width: number,
    allowfullscreen: string,
    autoplay: string,
    showText: string,
    showCaptions: string,
    onReady: func,
    onStartedPlaying: func,
    onPaused: func,
    onFinishedPlaying: func,
    onStartedBuffering: func,
    onFinishedBuffering: func,
    onError: func,
  };

  constructor(props) {
    super(props);

    /**
     * Set events that will be added to listen list.
     * REF: https://developers.facebook.com/docs/plugins/embedded-video-player/api#event-reference
     */
    this.eventsToListen = [
      {
        event: 'startedPlaying',
        listener: (props.onStartedPlaying) ?
                  () => this.props.onStartedPlaying(this.props.id) :
                  null,
      },
      {
        event: 'paused',
        listener: (props.onStartedPlaying) ?
                  () => this.props.onPaused(this.props.id) :
                  null,
      },
      {
        event: 'finishedPlaying',
        listener: (props.onFinishedPlaying) ?
                  () => this.props.onFinishedPlaying(this.props.id) :
                  null,
      },
      {
        event: 'startedBuffering',
        listener: (props.onStartedBuffering) ?
                  () => this.props.onStartedBuffering(this.props.id) :
                  null,
      },
      {
        event: 'finishedBuffering',
        listener: (props.onFinishedBuffering) ?
                  () => this.props.onFinishedBuffering(this.props.id) :
                  null,
      },
      {
        event: 'error',
        listener: (props.onError) ?
                  () => this.props.onError(this.props.id) :
                  null,
      },
    ];

    this.FB = null;
    this.videoPlayer = null;
    this.eventHandlers = null;
  }

  /**
   * Load Facebook SDK and set FB to global vars
   */
  componentDidMount() {
    const {
      videoId,
    } = this.props;

    if (typeof window !== "undefined") {
      this.loadFB()
        .then(res => {
          if (res) {
            this.FB = res;
            this.createPlayer(videoId);
          }
        });
    }
  }

  /**
   * Refresh component if a new video id is set,
   */
  componentWillReceiveProps(newProps) {
    if (this.FB && newProps.videoId !== this.props.videoId) {
      this.createPlayer(newProps.videoId);
    }
  }

  /**
   * Kill all event listeners
   */
  componentWillUnmount() {
    this.unsubscribe();
  }

  /**
   * Load Facebook SDK if it is not loaded already.
   */
  loadFB = () => {
    if(window.FB) {
      return new Promise(resolve => resolve(window.FB));
    }

    return new Promise(resolve => {
      window.fbAsyncInit = function() {
        return resolve(window.FB);
      };
      (function(d, s, id){
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {return;}
        js = d.createElement(s); js.id = id;
        js.src = "//connect.facebook.net/en_US/sdk.js#xfbml=1&version=v2.3";
        js.onload = function() {
          return resolve(window.FB);
        }
        fjs.parentNode.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));
    });
  }

  /**
   * Create player.
   *
   * @param {string} Facebook video id
   */
  createPlayer = (videoId) => {
    const {
      id,
      appId,
      allowfullscreen,
      autoplay,
      width,
      showText,
      showCaptions,
      onReady,
    } = this.props;
    const FB = this.FB;

    // Clear
    this.container.innerHTML = '';
    this.unsubscribe();

    const playerDiv = document.createElement('div');
    playerDiv.classList.add('fb-video');
    playerDiv.id = this.playerId;
    playerDiv.setAttribute('data-href', 'https://www.facebook.com/facebook/videos/' + videoId);
    playerDiv.setAttribute('data-allowfullscreen', allowfullscreen || 'false');
    playerDiv.setAttribute('data-autoplay', autoplay || 'false');
    playerDiv.setAttribute('data-width', width || 'auto');
    playerDiv.setAttribute('data-show-text', showText || 'false');
    playerDiv.setAttribute('data-show-captions', showCaptions || 'false');

    this.container.appendChild(playerDiv);

    FB.init({
      appId      : appId,
      xfbml      : true,
      version    : 'v2.5'
    });

    FB.Event.subscribe('xfbml.ready', this.fbEventOnReady);
  }

  get playerId() {
    const { id } = this.props;

    return id + '--player';
  }

  fbEventOnReady = (msg) => {
    const { onReady, id } = this.props;

    window.msg = msg;
    if (msg.type === 'video' &&
        (
          (id && msg.id === this.playerId) ||
          !id
        )
        ) {
      this.videoPlayer = msg.instance;

      // Dispatch ready event
      if (onReady) { onReady(id, this.videoPlayer); }

      // Subscribe to events
      this.subscribe();
    }
  }

  /**
   * Listen to events based on eventsToListen var.
   */
  subscribe = () => {
    this.eventHandlers = [];
    this.eventsToListen.map(ev => {
      if (ev.listener) {
        const handler = this.videoPlayer.subscribe(ev.event, ev.listener);
        this.eventHandlers.push({
          event: ev.event,
          handler,
        })
      };
    });
  }

  /**
   * Stop listening to events.
   */
  unsubscribe = () => {
    if (this.eventHandlers && this.eventHandlers.length) {
      this.eventHandlers.map(ev => {
        if (ev.handler.release) { ev.handler.release(ev.event); }
      });
    }

    FB.Event.unsubscribe('xfbml.ready', this.fbEventOnReady)
  }

  /**
   * Set container var to reuse as DOM object.
   */
  refContainer = (container) => {
    this.container = container;
  }

  render() {
    const { id, className } = this.props;

    return (
      <span>
        <div
          id={ id }
          className={ className }
          ref={ this.refContainer }
          />
      </span>
    );
  }
}

export default FacebookPlayer;
