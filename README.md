# Componente `radiospini`

`#RadioSpini #SpiniNelFianco`

## Utilizzo

1. Copiare la cartella `/app` contenente il componente `radiospini` 

2. Includere la libreria *zuix.js* prima della chiusura del tag `head` e configurare i percorsi del sito
```html
<head>
...

      <script src="https://cdn.jsdelivr.net/npm/zuix-dist@1.1.13"></script>
      <script>
         const config = zuix.store('config');
         // indirizzo base del sito
         config.baseUrl = '/radiospini/';
         // indirizzo assoluto cartella app
         config.resourcePath = '/radiospini/app/';
      </script>

</head>
```

3. Caricare il componente `radiospini` all'interno del tag `body`

```
 <div z-load="components/spini-player"></div>
```

Tutto qui!

Per personalizzare il componente `radiospini`, modificare i file contenuti nella cartella `app/components`.
