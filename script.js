/**
 * Surya Vilas Palace, Udaipur — Interactive Hospitality Experience
 * Handles: sticky header, mobile drawer, room booking & live GST tariff calculator,
 * WhatsApp concierge pre-filled message generator, gallery filters & lightbox, scroll reveals.
 */

const WHATSAPP_NUMBER = "912942430000";

const SUITES = {
  maharana: {
    name: "Maharana Lakefront Heritage Suite",
    rate: 68000,
  },
  pichola: {
    name: "Pichola Private Plunge Pavilion",
    rate: 46000,
  },
  aravalli: {
    name: "Aravalli Courtyard Chamber",
    rate: 32000,
  },
};

const GST_RATE = 0.18;

// Utility: format INR nicely (e.g. ₹2,40,720)
function formatINR(amount) {
  return "₹" + Math.round(amount).toLocaleString("en-IN");
}

// Utility: YYYY-MM-DD date offset from today
function getOffsetDateString(daysFromToday) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  return date.toISOString().split("T")[0];
}

// Calculate number of nights (minimum 1)
function calculateNights(checkinStr, checkoutStr) {
  const inDate = new Date(checkinStr);
  const outDate = new Date(checkoutStr);
  if (Number.isNaN(inDate.getTime()) || Number.isNaN(outDate.getTime())) return 1;
  const diffDays = Math.round((outDate - inDate) / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

document.addEventListener("DOMContentLoaded", () => {
  /* ----------------------------------------------------------------------
     1. Sticky Header on Scroll
     ---------------------------------------------------------------------- */
  const header = document.getElementById("site-header");
  const onScroll = () => {
    if (window.scrollY > 40) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ----------------------------------------------------------------------
     2. Mobile Navigation Drawer
     ---------------------------------------------------------------------- */
  const menuToggle = document.getElementById("mobile-menu-toggle");
  const mobileDrawer = document.getElementById("mobile-drawer");
  const drawerClose = document.getElementById("mobile-drawer-close");
  const drawerBackdrop = document.getElementById("drawer-backdrop");
  const drawerLinks = document.querySelectorAll(".drawer-link");

  function openDrawer() {
    mobileDrawer.classList.add("open");
    drawerBackdrop.classList.add("open");
    mobileDrawer.setAttribute("aria-hidden", "false");
    menuToggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }

  function closeDrawer() {
    mobileDrawer.classList.remove("open");
    drawerBackdrop.classList.remove("open");
    mobileDrawer.setAttribute("aria-hidden", "true");
    menuToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  menuToggle.addEventListener("click", openDrawer);
  drawerClose.addEventListener("click", closeDrawer);
  drawerBackdrop.addEventListener("click", closeDrawer);
  drawerLinks.forEach((link) => link.addEventListener("click", closeDrawer));

  /* ----------------------------------------------------------------------
     3. Booking Date Initialization & Live Tariff Calculation
     ---------------------------------------------------------------------- */
  const qbForm = document.getElementById("quick-booking-form");
  const qbCheckin = document.getElementById("qb-checkin");
  const qbCheckout = document.getElementById("qb-checkout");
  const qbSuite = document.getElementById("qb-suite");
  const qbGuests = document.getElementById("qb-guests");

  const modalBackdrop = document.getElementById("booking-modal-backdrop");
  const closeModalBtn = document.getElementById("close-booking-modal");
  const bookingForm = document.getElementById("booking-form");
  const bookingConfirmation = document.getElementById("booking-confirmation");
  const resetBookingBtn = document.getElementById("reset-booking-btn");

  const bkCheckin = document.getElementById("bk-checkin");
  const bkCheckout = document.getElementById("bk-checkout");
  const bkSuite = document.getElementById("bk-suite");
  const bkGuests = document.getElementById("bk-guests");
  const addonTransfer = document.getElementById("addon-transfer");
  const addonDining = document.getElementById("addon-dining");

  const summaryNightsLabel = document.getElementById("summary-nights-label");
  const summarySubtotal = document.getElementById("summary-subtotal");
  const summaryAddonsRow = document.getElementById("summary-addons-row");
  const summaryAddons = document.getElementById("summary-addons");
  const summaryTax = document.getElementById("summary-tax");
  const summaryTotal = document.getElementById("summary-total");

  const defaultIn = getOffsetDateString(1);
  const defaultOut = getOffsetDateString(4);

  [qbCheckin, bkCheckin].forEach((input) => {
    input.min = getOffsetDateString(0);
    input.value = defaultIn;
  });
  [qbCheckout, bkCheckout].forEach((input) => {
    input.min = defaultIn;
    input.value = defaultOut;
  });

  function syncCheckoutMin(inInput, outInput) {
    const nextDay = new Date(inInput.value);
    if (!Number.isNaN(nextDay.getTime())) {
      nextDay.setDate(nextDay.getDate() + 1);
      const minOut = nextDay.toISOString().split("T")[0];
      outInput.min = minOut;
      if (outInput.value <= inInput.value) {
        outInput.value = minOut;
      }
    }
  }

  qbCheckin.addEventListener("change", () => syncCheckoutMin(qbCheckin, qbCheckout));
  bkCheckin.addEventListener("change", () => {
    syncCheckoutMin(bkCheckin, bkCheckout);
    updateRateSummary();
  });
  bkCheckout.addEventListener("change", updateRateSummary);
  bkSuite.addEventListener("change", updateRateSummary);
  addonTransfer.addEventListener("change", updateRateSummary);
  addonDining.addEventListener("change", updateRateSummary);

  function computeQuote() {
    const suite = SUITES[bkSuite.value] || SUITES.maharana;
    const nights = calculateNights(bkCheckin.value, bkCheckout.value);
    const roomSubtotal = suite.rate * nights;

    let addonsTotal = 0;
    const addonNames = [];
    if (addonTransfer.checked) {
      addonsTotal += Number(addonTransfer.value);
      addonNames.push("Private Airport Sedan & Champagne Boat");
    }
    if (addonDining.checked) {
      addonsTotal += Number(addonDining.value);
      addonNames.push("Candlelit Chhatri Dinner");
    }

    const taxableAmount = roomSubtotal + addonsTotal;
    const tax = taxableAmount * GST_RATE;
    const grandTotal = taxableAmount + tax;

    return { suite, nights, roomSubtotal, addonsTotal, addonNames, tax, grandTotal };
  }

  function updateRateSummary() {
    const q = computeQuote();
    summaryNightsLabel.textContent = `${q.suite.name} (${q.nights} ${q.nights === 1 ? "night" : "nights"})`;
    summarySubtotal.textContent = formatINR(q.roomSubtotal);

    if (q.addonsTotal > 0) {
      summaryAddonsRow.hidden = false;
      summaryAddons.textContent = formatINR(q.addonsTotal);
    } else {
      summaryAddonsRow.hidden = true;
    }

    summaryTax.textContent = formatINR(q.tax);
    summaryTotal.textContent = formatINR(q.grandTotal);
  }

  function openBookingModal(preset = {}) {
    closeDrawer();
    if (preset.suite) bkSuite.value = preset.suite;
    if (preset.checkin) bkCheckin.value = preset.checkin;
    if (preset.checkout) bkCheckout.value = preset.checkout;
    if (preset.guests) bkGuests.value = preset.guests;

    syncCheckoutMin(bkCheckin, bkCheckout);
    updateRateSummary();

    bookingForm.hidden = false;
    bookingConfirmation.hidden = true;
    modalBackdrop.classList.add("open");
    modalBackdrop.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeBookingModal() {
    modalBackdrop.classList.remove("open");
    modalBackdrop.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  document.querySelectorAll(".open-booking-btn").forEach((btn) => {
    btn.addEventListener("click", () => openBookingModal());
  });

  document.querySelectorAll(".select-suite-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      openBookingModal({ suite: btn.dataset.suite });
    });
  });

  qbForm.addEventListener("submit", (e) => {
    e.preventDefault();
    openBookingModal({
      checkin: qbCheckin.value,
      checkout: qbCheckout.value,
      suite: qbSuite.value,
      guests: qbGuests.value,
    });
  });

  closeModalBtn.addEventListener("click", closeBookingModal);
  resetBookingBtn.addEventListener("click", closeBookingModal);
  modalBackdrop.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) closeBookingModal();
  });

  // Build pre-filled WhatsApp concierge URL from booking form
  function buildWhatsAppBookingUrl(refId = "") {
    const q = computeQuote();
    const guestName = document.getElementById("bk-name").value.trim() || "Guest";
    const guestPhone = document.getElementById("bk-phone").value.trim();
    const notes = document.getElementById("bk-notes").value.trim();

    const lines = [
      `Namaste Surya Vilas Palace Concierge,`,
      `I would like to request a reservation:`,
      refId ? `• Reference: ${refId}` : null,
      `• Guest: ${guestName}${guestPhone ? ` (${guestPhone})` : ""}`,
      `• Sanctuary: ${q.suite.name}`,
      `• Check-in: ${bkCheckin.value}`,
      `• Check-out: ${bkCheckout.value} (${q.nights} ${q.nights === 1 ? "night" : "nights"})`,
      `• Guests: ${bkGuests.value}`,
      q.addonNames.length ? `• Enhancements: ${q.addonNames.join(", ")}` : null,
      `• Estimated Total (incl. GST): ${formatINR(q.grandTotal)}`,
      notes ? `• Notes: ${notes}` : null,
    ].filter(Boolean);

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
  }

  document.getElementById("send-booking-whatsapp").addEventListener("click", () => {
    const url = buildWhatsAppBookingUrl();
    window.open(url, "_blank", "noopener,noreferrer");
  });

  bookingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = computeQuote();
    const guestName = document.getElementById("bk-name").value.trim() || "Honored Guest";
    const refId = `SVP-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    document.getElementById("conf-ref-id").textContent = refId;
    document.getElementById("conf-details").textContent =
      `Thank you, ${guestName}. Your ${q.nights}-night sanctuary request for the ${q.suite.name} ` +
      `(${bkCheckin.value} to ${bkCheckout.value}, estimated ${formatINR(q.grandTotal)} incl. taxes) ` +
      `is queued with our Udaipur Butler Desk.`;

    document.getElementById("conf-wa-link").href = buildWhatsAppBookingUrl(refId);
    bookingForm.hidden = true;
    bookingConfirmation.hidden = false;
  });

  /* ----------------------------------------------------------------------
     4. Photo Gallery Filtering & Lightbox
     ---------------------------------------------------------------------- */
  const filterButtons = document.querySelectorAll(".filter-btn");
  const galleryItems = Array.from(document.querySelectorAll(".gallery-item"));

  const lightbox = document.getElementById("gallery-lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxCaption = document.getElementById("lightbox-caption");
  const lightboxClose = document.getElementById("lightbox-close");
  const lightboxPrev = document.getElementById("lightbox-prev");
  const lightboxNext = document.getElementById("lightbox-next");

  let activeLightboxIndex = 0;

  function visibleGalleryItems() {
    return galleryItems.filter((item) => !item.classList.contains("hidden-item"));
  }

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const category = btn.dataset.filter;
      filterButtons.forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");

      galleryItems.forEach((item) => {
        const matches = category === "all" || item.dataset.category === category;
        item.classList.toggle("hidden-item", !matches);
      });
    });
  });

  function showLightboxAt(index) {
    const items = visibleGalleryItems();
    if (!items.length) return;
    activeLightboxIndex = (index + items.length) % items.length;
    const item = items[activeLightboxIndex];
    const img = item.querySelector("img");
    const title = item.querySelector(".cap-title")?.textContent || img.alt;

    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightboxCaption.textContent = title;
  }

  function openLightbox(item) {
    const items = visibleGalleryItems();
    const index = items.indexOf(item);
    showLightboxAt(index >= 0 ? index : 0);
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  galleryItems.forEach((item) => {
    item.addEventListener("click", () => openLightbox(item));
  });

  lightboxClose.addEventListener("click", closeLightbox);
  lightboxPrev.addEventListener("click", () => showLightboxAt(activeLightboxIndex - 1));
  lightboxNext.addEventListener("click", () => showLightboxAt(activeLightboxIndex + 1));
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Global keyboard shortcuts (Escape / ArrowLeft / ArrowRight)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeLightbox();
      closeBookingModal();
      closeDrawer();
      toggleWaPopover(false);
    } else if (lightbox.classList.contains("open")) {
      if (e.key === "ArrowLeft") showLightboxAt(activeLightboxIndex - 1);
      if (e.key === "ArrowRight") showLightboxAt(activeLightboxIndex + 1);
    }
  });

  /* ----------------------------------------------------------------------
     5. Floating WhatsApp Concierge Widget
     ---------------------------------------------------------------------- */
  const waFab = document.getElementById("wa-fab");
  const waPopover = document.getElementById("wa-popover");
  const waClose = document.getElementById("wa-popover-close");

  function toggleWaPopover(forceOpen) {
    const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : !waPopover.classList.contains("open");
    waPopover.classList.toggle("open", shouldOpen);
    waPopover.setAttribute("aria-hidden", String(!shouldOpen));
    waFab.setAttribute("aria-expanded", String(shouldOpen));
  }

  waFab.addEventListener("click", () => toggleWaPopover());
  waClose.addEventListener("click", () => toggleWaPopover(false));

  /* ----------------------------------------------------------------------
     6. Newsletter Signup & Scroll Reveal Animations
     ---------------------------------------------------------------------- */
  const newsletterForm = document.getElementById("newsletter-form");
  const newsletterEmail = document.getElementById("newsletter-email");
  const newsletterFeedback = document.getElementById("newsletter-feedback");

  newsletterForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = newsletterEmail.value.trim();
    if (!email) return;
    newsletterFeedback.textContent = `Thank you. Seasonal invitations will be sent to ${email}.`;
    newsletterEmail.value = "";
  });

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
});
