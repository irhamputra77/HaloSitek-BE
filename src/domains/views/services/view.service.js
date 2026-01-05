const viewRepository = require("../repositeories/view.repository");

class ViewService {
    incrementArsipediaView(userId, arsipediaId) {
        return viewRepository.incrementArsipediaView(userId, arsipediaId);
    }

    incrementArchitectView(userId, architectId) {
        return viewRepository.incrementArchitectView(userId, architectId);
    }

    getArsipediaSummary(arsipediaId, userId) {
        return viewRepository.getArsipediaSummary(arsipediaId, userId);
    }

    getArchitectSummary(architectId, userId) {
        return viewRepository.getArchitectSummary(architectId, userId);
    }
}

module.exports = new ViewService();
