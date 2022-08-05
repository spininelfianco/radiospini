themeSetup();

function themeSetup() {
  const doc = zuix.$(document.body);
  const toggle = doc.find('.theme-toggle');
  const themeDark = 'theme-dark';
  const storeKey = 'app.theme';
  const fadeColors = {
    transition: 'color 300ms ease-in, background-color 300ms ease-in',
  };
  setTimeout(function () {
    doc.css(fadeColors);
    doc.find('header').css(fadeColors);
    doc.find('nav').css(fadeColors);
    doc.find('footer').css(fadeColors);
  }, 100);
  toggle.on('change', toggleTheme);
  toggleTheme();
  function toggleTheme(ev) {
    const checked = ev
      ? toggle.checked()
      : localStorage.getItem(storeKey) === 'true';
    !ev && toggle.checked(checked);
    checked ? doc.addClass(themeDark) : doc.removeClass(themeDark);
    document.documentElement.style.setProperty(
      'color-scheme',
      checked ? 'dark' : 'light'
    );
    localStorage.setItem(storeKey, String(checked));
  }
}

function sharePage() {
  const item = {
    title: 'Radio #SpiniNelFianco',
    text: '@RadioSpini la radio antipro!',
    url: location.href,
  };
  if (navigator.share) {
    navigator
      .share(item)
      .then(() => {
        console.log('Document url shared.');
      })
      .catch(console.error);
  } else {
    // TODO: copy url to clipboard and popup a message
    console.log('Sharing is not available in the current context.');
  }
}
