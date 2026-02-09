/**
 * CargoWatch - Reviews module
 * Charge et affiche les avis clients depuis l'API
 */
(function() {
    'use strict';

    const AVATAR_FALLBACK = 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?q=80&w=2940&auto=format&fit=crop';
    const AVATARS = [
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
        'https://images.unsplash.com/photo-1568602471122-7832951cc4c5',
        'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e',
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7',
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb'
    ];

    function stars(rating) {
        const n = Math.min(5, Math.max(0, Math.round(rating) || 0));
        return '★'.repeat(n) + '☆'.repeat(5 - n);
    }

    function timeAgo(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const now = new Date();
        const s = Math.floor((now - d) / 1000);
        if (s < 60) return 'À l\'instant';
        if (s < 3600) return 'Il y a ' + Math.floor(s / 60) + ' min';
        if (s < 86400) return 'Il y a ' + Math.floor(s / 3600) + ' h';
        if (s < 2592000) return 'Il y a ' + Math.floor(s / 86400) + ' jours';
        if (s < 31536000) return 'Il y a ' + Math.floor(s / 2592000) + ' mois';
        return 'Il y a ' + Math.floor(s / 31536000) + ' an(s)';
    }

    function avatarForIndex(i) {
        return AVATARS[i % AVATARS.length];
    }

    function renderReviewCard(review, index, containerId) {
        const avatar = avatarForIndex(index);
        const starHtml = '<span class="text-yellow-400">' + stars(review.rating) + '</span>';
        const reviewId = escapeHtml(review.id || '');
        const authorName = escapeHtml(review.author || '');
        return `
            <div class="card relative" data-review-id="${reviewId}" data-review-author="${authorName}">
                <button type="button" class="review-delete-btn absolute top-3 right-3 p-1.5 text-gray-400 hover:text-error hover:bg-error/10 rounded-full transition-colors" 
                        title="Supprimer cet avis" aria-label="Supprimer">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                </button>
                <div class="flex items-center mb-4">
                    <img src="${avatar}" alt="${authorName}" class="w-12 h-12 rounded-full object-cover mr-4"
                         onerror="this.src='${AVATAR_FALLBACK}'; this.onerror=null;">
                    <div>
                        <div class="font-semibold text-text-primary">${authorName}</div>
                        <div class="text-sm text-text-muted">Client CargoWatch</div>
                    </div>
                </div>
                <div class="flex mb-2">${starHtml}</div>
                <p class="text-text-secondary text-sm">${review.comment ? '"' + escapeHtml(review.comment) + '"' : '★★★★★ Service recommandé'}</p>
                <div class="mt-3 text-xs text-text-muted">${timeAgo(review.createdAt)}</div>
            </div>
        `;
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    window.CargoWatchReviews = {
        load: async function(containerId, limit) {
            const el = document.getElementById(containerId);
            if (!el) return;
            el.innerHTML = '<p class="text-text-muted text-center py-8">Chargement des avis...</p>';
            try {
                const res = await fetch('/api/reviews?limit=' + (limit || 50));
                const data = await res.json();
                const reviews = data.reviews || [];
                if (reviews.length === 0) {
                    el.innerHTML = '<p class="text-text-muted text-center py-8">Aucun avis pour le moment. Soyez le premier à nous laisser un avis !</p>';
                    return;
                }
                el.innerHTML = reviews.map((r, i) => renderReviewCard(r, i, containerId)).join('');
                el.querySelectorAll('.review-delete-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const card = this.closest('[data-review-id]');
                        const id = card?.dataset?.reviewId;
                        const author = card?.dataset?.reviewAuthor || '';
                        if (!id) return;
                        const isAdmin = containerId === 'reviews-grid-admin';
                        const confirmMsg = isAdmin ? 'Supprimer cet avis ?' : 'Entrez votre nom pour confirmer la suppression :';
                        let nameToSend = '';
                        if (isAdmin) {
                            if (!confirm(confirmMsg)) return;
                            nameToSend = '';
                        } else {
                            const name = prompt(confirmMsg, author);
                            if (name === null) return;
                            nameToSend = name.trim();
                        }
                        window.CargoWatchReviews.delete(id, nameToSend).then(() => {
                            window.CargoWatchReviews.load(containerId, limit);
                        }).catch(err => {
                            alert(err.message || 'Erreur lors de la suppression.');
                        });
                    });
                });
            } catch (err) {
                console.error('Erreur chargement reviews:', err);
                el.innerHTML = '<p class="text-text-muted text-center py-8">Impossible de charger les avis.</p>';
            }
        },

        submit: async function(author, rating, comment) {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ author: author.trim(), rating: Number(rating), comment: (comment || '').trim() })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'envoi');
            return data;
        },

        delete: async function(id, author) {
            const res = await fetch('/api/reviews/' + encodeURIComponent(id), {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ author: author || '' })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || data.message || 'Erreur lors de la suppression');
            return data;
        }
    };
})();
