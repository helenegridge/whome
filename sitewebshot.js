$(function () {
  let snapshotUrl = "";

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

    // Der Screenshot wird von einem externen Dienst erstellt.
    snapshotUrl =
      "https://image.thum.io/get/width/1200/" + pageUrl.href;

    $("#status").text("Snapshot wird erstellt …");
    $("#download-button").prop("disabled", true);

    const $image = $("<img>", {
      alt: "Snapshot von " + pageUrl.href
    });

    $image.on("load", function () {
      $("#snapshot-container").empty().append($image);
      $("#status").text("Snapshot erstellt.");
      $("#download-button").prop("disabled", false);
    });

    $image.on("error", function () {
      $("#snapshot-container")
        .html('<p class="placeholder">Der Snapshot konnte nicht geladen werden.</p>');
      $("#status").text("Bitte URL prüfen und erneut versuchen.");
    });

    $image.attr("src", snapshotUrl);
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
      $("#status").text(
        "Der direkte Download wurde blockiert. Im geöffneten Tab kannst du das Bild speichern."
      );
    }
  });
});
