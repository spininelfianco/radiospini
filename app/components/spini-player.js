function SpiniPlayer(cp) {
  let audioPlayer;
  let coverImage;
  let trackArtist;
  let trackTitle;
  const defaultDisplay = {
    cover:
      location.protocol +
      '//' +
      location.host +
      (location.port ? ':' + location.port : '') +
      zuix.store('config').resourcePath +
      'components/spini-player/cover.png',
    artist: '@RadioSpini',
    title: 'Radio SpiniNelFianco',
    url: 'https://stream.zeno.fm/rcu55zb1sxhvv',
  };
  const radioDisplay = {
    ...defaultDisplay,
  };
  let playButton;
  let pauseButton;
  let muteButton;
  let unmuteButton;
  let volumeButton;
  let volumeControl;
  let menuButton;
  let menuPlaylist;
  let disableRadio = false;
  let delayedOperation;

  this.create = onCreate;

  function onCreate() {
    coverImage = this.field('cover');
    trackArtist = this.field('track-artist');
    trackTitle = this.field('track-title');
    audioPlayer = this.field('player').get();
    playButton = this.field('btn-play').on({
      click: () => {
        audioPlayer.load();
        audioPlayer.play();
      },
    });
    pauseButton = this.field('btn-pause').on({
      click: () => audioPlayer.pause(),
    });
    muteButton = this.field('btn-mute').on({
      click: () => {
        audioPlayer.muted = true;
        refreshDisplay();
      },
    });
    unmuteButton = this.field('btn-unmute').on({
      click: () => {
        audioPlayer.muted = false;
        volumeControl.show();
        refreshDisplay();
        volumeButton.get().focus();
      },
    });
    volumeControl = this.field('btn-volume-set').hide();
    volumeButton = this.field('btn-volume').on({
      click: () => {
        volumeControl.position().visible
          ? volumeControl.hide()
          : volumeControl.show();
      },
      focusout: () => setTimeout(() => volumeControl.hide(), 200),
    });
    volumeControl.find('.volume-tick').on({
      pointerdown: (event, $el) => {
        audioPlayer.volume = +$el.attr('volume') / 10;
        refreshDisplay();
      },
    });
    menuButton = this.field('btn-menu').on({
      click: () => zuix.context('my-menu').show(),
    });
    buildMenuPlaylist(this.field('menu'), () => {
      refreshDisplay();
      initPlayer();
    });
    this.expose({ getInfo: () => radioDisplay });
  }

  function buildMenuPlaylist(menu, callback) {
    fetch('radio-playlist.json')
      .then((response) => response.json())
      .then((playlist) => {
        menuPlaylist = playlist;
        playlist.forEach((item, i) => {
          const menuItem = `<button layout="row center-left" index="${i}" ${
            item.url.length ? '' : 'disabled'
          }>
            <i class="material-icons">${item.icon}</i>
            <span>${item.title}</span>
            </button>`;
          menu.append(menuItem);
        });
        zuix.context('my-menu', (contextMenu) => {
          contextMenu.$.one('close', () => {
            if (audioPlayer.src.length > 0) {
              audioPlayer.play();
            }
          });
          contextMenu.$.find('button').on({
            click: (e, $el) => {
              const itemIndex = $el.attr('index');
              if (itemIndex === null) {
                startRadio();
              } else {
                stopRadio();
                const item = menuPlaylist[+itemIndex];
                radioDisplay.cover = defaultDisplay.cover;
                radioDisplay.artist = item.artist;
                radioDisplay.title = item.title;
                audioPlayer.src = item.url;
                audioPlayer.play();
                refreshDisplay();
              }
            },
          });
          contextMenu.show();
          callback();
        });
      });
  }

  function initPlayer() {
    audioPlayer.onplay = refreshDisplay;
    audioPlayer.onpause = refreshDisplay;
    audioPlayer.onerror = refreshDisplay;
    audioPlayer.onloadedmetadata = () => {
      audioPlayer.controls = audioPlayer.seekable.end(0) !== Infinity;
      if (audioPlayer.controls) {
        playButton.hide();
        pauseButton.hide();
      }
    };
    audioPlayer.volume = 0.5;
    startRadio();
  }

  function startRadio() {
    disableRadio = false;
    radioDisplay.cover = defaultDisplay.cover;
    radioDisplay.artist = defaultDisplay.artist;
    radioDisplay.title = defaultDisplay.title;
    audioPlayer.controls = false;
    audioPlayer.src = defaultDisplay.url;
    audioPlayer.play();
    getStreamInfo();
  }
  function stopRadio() {
    disableRadio = true;
    audioPlayer.pause();
  }

  function getStreamInfo() {
    clearTimeout(delayedOperation);
    const dataUrl =
      'https://corsproxy.io/?https://zenoplay.zenomedia.com/api/zenofm/nowplaying/p2m7uyb1sxhvv';
    fetch(dataUrl)
      .then((response) => response.json())
      .then((data) => {
        if (disableRadio) return;
        const { artist, title } = data;
        if (
          (artist && artist !== radioDisplay.artist) ||
          (title && title !== radioDisplay.title)
        ) {
          radioDisplay.cover = defaultDisplay.cover;
          radioDisplay.artist = artist;
          radioDisplay.title = title;
          refreshDisplay();
          getArtwork(artist, title);
        }
        delayedOperation = setTimeout(getStreamInfo, 10000);
      })
      .catch((err) => {
        console.log(err);
        if (disableRadio) return;
        // TODO: report error
        delayedOperation = setTimeout(getStreamInfo, 10000);
      });
  }
  function getArtwork(artist, title, retry) {
    clearTimeout(delayedOperation);
    if (retry == null) retry = 1;
    const q = encodeURI(`${artist},${title}`).replace(/&/g, '');
    const artworkUrl = `https://corsproxy.io/?https://player.zenomedia.com/api/utils/artwork?metadata=${q}`;
    fetch(artworkUrl)
      .then((response) => response.json())
      .then((data) => {
        if (disableRadio) return;
        if (data.imageUrl) {
          radioDisplay.cover = data.imageUrl;
        }
        refreshDisplay();
      })
      .catch((err) => {
        console.log(err);
        if (disableRadio) return;
        if (retry < 4) {
          delayedOperation = setTimeout(
            () => getArtwork(artist, title, ++retry),
            2000
          );
        }
        refreshDisplay();
      });
  }

  function refreshDisplay() {
    coverImage.attr('src', radioDisplay.cover);
    trackArtist.html(radioDisplay.artist);
    trackTitle.html(radioDisplay.title);
    // refresh buttons
    if (!audioPlayer.controls) {
      if (audioPlayer.paused) {
        pauseButton.hide();
        playButton.show();
      } else {
        pauseButton.show();
        playButton.hide();
      }
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
      if (10 - i <= volume) {
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
          { src: radioDisplay.cover, sizes: '300x300', type: 'image/jpg' },
        ],
      });
    }
  }
}

module.exports = SpiniPlayer;
