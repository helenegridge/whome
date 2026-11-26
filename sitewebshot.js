$(function () {
  const storageKey = "webhome-snapshots";
  let snapshotUrl = "";

  function getSavedSnapshots() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  }

  function saveSnapshot(pageUrl, imageUrl) {
    const snapshots = getSavedSnapshots();

    // Doppelte Einträge derselben URL vermeiden.
    const filtered = snapshots.filter((snapshot) => snapshot.pageUrl !== pageUrl);
    filtered.unshift({ pageUrl, imageUrl });

    try {
      localStorage.setItem(storageKey, JSON.stringify(filtered));
    } catch {
      $("#status").text("Snapshot erstellt, aber der Browser-Speicher ist voll.");
    }
  }

  function createSnapshotContainer(pageUrl, imageUrl, onLoad, onError) {
    const $container = $("<div>", {
      class: "snapshot-container"
    });

    const $image = $("<img>", {
      alt: "Snapshot von " + pageUrl,
      src: imageUrl
    });

    const $link = $("<a>", {
      href: pageUrl,
      target: "_blank",
      rel: "noopener noreferrer",
      text: pageUrl
    });

    $image.on("load", function () {
      $container.append($image, $link);
      $("#snapshots").append($container);

      if (onLoad) onLoad();
    });

    $image.on("error", function () {
      if (onError) onError();
    });
  }

  // Gespeicherte Snapshots wiederherstellen.
  getSavedSnapshots().forEach(({ pageUrl, imageUrl }) => {
    if (!pageUrl || !imageUrl) return;

    createSnapshotContainer(pageUrl, imageUrl, null, function () {
      // Nicht mehr ladbare Snapshots aus dem gespeicherten Eintrag entfernen.
      const remaining = getSavedSnapshots().filter(
        (snapshot) => snapshot.pageUrl !== pageUrl
      );

      try {
        localStorage.setItem(storageKey, JSON.stringify(remaining));
      } catch {
        // Der fehlgeschlagene Eintrag bleibt dann im Speicher.
      }
    });
  });

  $("#snapshot-form").on("submit", function (event) {
    event.preventDefault();

    const input = $("#url").val().trim();
    let pageUrl;

    try {
      pageUrl = new URL(input);

      if (!["http:", "https:"].includes(pageUrl.protocol)) {
        throw new Error("Nur HTTP- und HTTPS-Adressen sind erlaubt.");
      }
    } catch (error) {
      $("#status").text(error.message || "Bitte eine gültige URL eingeben.");
      return;
    }

    const pageUrlString = pageUrl.href;
    snapshotUrl = "https://image.thum.io/get/width/1200/" + pageUrlString;

    $("#status").text("Snapshot wird erstellt …");
    $("#download-button").prop("disabled", true);

    createSnapshotContainer(
      pageUrlString,
      snapshotUrl,
      function () {
        saveSnapshot(pageUrlString, snapshotUrl);
        $("#status").text("Snapshot erstellt.");
        $("#download-button").prop("disabled", false);
      },
      function () {
        $("#status").text("Snapshot konnte nicht geladen werden. Bitte URL prüfen und erneut versuchen.");
      }
    );
  });

  $("#download-button").on("click", async function () {
    if (!snapshotUrl) return;

    try {
      const response = await fetch(snapshotUrl);

      if (!response.ok) {
        throw new Error("Download nicht verfügbar.");
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = blobUrl;
      link.download = "snapshot.png";
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(blobUrl);
    } catch {
      // Bei fehlender CORS-Freigabe den Screenshot in einem Tab öffnen.
      window.open(snapshotUrl, "_blank", "noopener");
      $("#status").text(
        "Der direkte Download wurde blockiert. Im geöffneten Tab kannst du das Bild speichern."
      );
    }
  });
});
