function SpiniPlayer(cp) {
  let audioPlayer;
  let coverImage;
  let trackArtist;
  let trackTitle;
  const defaultDisplay = {
    cover: zuix.store('config').resourcePath + 'components/spini-player.png',
    artist: '@RadioSpini',
    title: 'Radio SpiniNelFianco'
  };
  const radioDisplay = {
    ...defaultDisplay
  };
  let playButton;
  let pauseButton;
  let muteButton;
  let unmuteButton;
  let volumeButton;
  let volumeControl;

  this.init = onInit;
  this.create = onCreate;

  function onInit() {
    zuix.using('style', '@cdnjs/flex-layout-attribute/1.0.3/css/flex-layout-attribute.min.css');
    zuix.using('style', 'https://fonts.googleapis.com/icon?family=Material+Icons&display=swap');
  }
  function onCreate() {
    coverImage = this.field('cover');
    trackArtist = this.field('track-artist');
    trackTitle = this.field('track-title');
    audioPlayer = this.field('player').get();
    playButton = this.field('btn-play').on({
      click: () => audioPlayer.play()
    });
    pauseButton = this.field('btn-pause').on({
      click: () => audioPlayer.pause()
    });
    muteButton = this.field('btn-mute').on({
      click: () => {
        audioPlayer.muted = true;
        refreshDisplay();
      }
    });
    unmuteButton = this.field('btn-unmute').on({
      click: () => {
        audioPlayer.muted = false;
        volumeControl.show();
        refreshDisplay();
      }
    });
    volumeControl = this.field('btn-volume-set').hide();
    volumeButton = this.field('btn-volume').on({
      click: () => {
        volumeControl.position().visible ? volumeControl.hide() : volumeControl.show();
      }
    });
    volumeControl.find('.volume-tick').on({
      pointerdown: (event, $el) => {
        audioPlayer.volume = +$el.attr('volume') / 10;
        refreshDisplay();
        setTimeout(() => volumeControl.hide(), 300);
      }
    });
    refreshDisplay();
    initPlayer();
  }

  function initPlayer() {
    audioPlayer.onplay = refreshDisplay;
    audioPlayer.onpause = refreshDisplay;
    audioPlayer.onerror = refreshDisplay;
    audioPlayer.volume = 0.5;
    // audioPlayer.muted = true;
    setTimeout(() => audioPlayer.play(), 200);
    getStreamInfo();
  }

  function getStreamInfo() {
    const dataUrl = 'https://corsproxy.io/?https://zenoplay.zenomedia.com/api/zenofm/nowplaying/p2m7uyb1sxhvv';
    fetch(dataUrl)
        .then((response) => response.json())
        .then((data) => {
          const {artist, title} = data;
          if ((artist && artist !== radioDisplay.artist) || (title && title !== radioDisplay.title)) {
            radioDisplay.cover = defaultDisplay.cover;
            radioDisplay.artist = artist;
            radioDisplay.title = title;
            refreshDisplay();
            getArtwork(artist, title);
          }
          setTimeout(getStreamInfo, 10000);
        }).catch((err) => {
          console.log(err);
          // TODO: report error
          setTimeout(getStreamInfo, 10000);
        });
  }
  function getArtwork(artist, title, retry) {
    if (retry == null) retry = 1;
    const q = encodeURI(`${artist},${title}`).replace(/&/g, '');
    const artworkUrl = `https://corsproxy.io/?https://player.zenomedia.com/api/utils/artwork?metadata=${q}`;
    fetch(artworkUrl)
        .then((response) => response.json())
        .then((data) => {
          if (data.imageUrl) {
            radioDisplay.cover = data.imageUrl;
          }
          refreshDisplay();
        })
        .catch((err) => {
          console.log(err);
          if (retry < 4) {
            setTimeout(() => getArtwork(artist, title, ++retry), 2000);
          }
          refreshDisplay();
        });
  }

  function refreshDisplay() {
    coverImage.attr('src', radioDisplay.cover);
    trackArtist.html(radioDisplay.artist);
    trackTitle.html(radioDisplay.title);
    // refresh buttons
    if (audioPlayer.paused) {
      pauseButton.hide();
      playButton.show();
    } else {
      pauseButton.show();
      playButton.hide();
    }
    if (audioPlayer.muted) {
      muteButton.hide();
      unmuteButton.show();
      volumeControl.hide();
      volumeButton.hide();
    } else {
      muteButton.show();
      unmuteButton.hide();
      volumeButton.show();
    }
    // refresh volume ticks
    const volume = audioPlayer.volume * 10;
    volumeControl.find('.volume-tick').each((i, e, el) => {
      if ((10-i) <= volume) {
        el.children().addClass('on');
      } else {
        el.children().removeClass('on');
      }
    });
    // update track info on mobile browsers
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: radioDisplay.title,
        artist: radioDisplay.artist,
        album: 'RadioSpini',
        artwork: [
          {src: radioDisplay.cover, sizes: '300x300', type: 'image/jpg'}
        ]
      });
    }
  }
}

module.exports = SpiniPlayer;
