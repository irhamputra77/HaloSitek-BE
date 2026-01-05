const prisma = require("../../../config/prisma-client");

class ViewRepository {
    async incrementArsipediaView(userId, arsipediaId) {
        return prisma.viewedArsipedia.upsert({
            where: { userId_arsipediaId: { userId, arsipediaId } },
            create: { userId, arsipediaId, viewedCount: 1 },
            update: { viewedCount: { increment: 1 } },
        });
    }

    async incrementArchitectView(userId, architectId) {
        return prisma.viewedArsitek.upsert({
            where: { userId_architectId: { userId, architectId } },
            create: { userId, architectId, viewedCount: 1 },
            update: { viewedCount: { increment: 1 } },
        });
    }

    async getArsipediaSummary(arsipediaId, userId = null) {
        const [agg, unique] = await Promise.all([
            prisma.viewedArsipedia.aggregate({
                where: { arsipediaId },
                _sum: { viewedCount: true },
            }),
            prisma.viewedArsipedia.count({ where: { arsipediaId } }),
        ]);

        let myViews = null;
        if (userId) {
            const mine = await prisma.viewedArsipedia.findUnique({
                where: { userId_arsipediaId: { userId, arsipediaId } },
                select: { viewedCount: true },
            });
            myViews = mine?.viewedCount ?? 0;
        }

        return {
            totalViews: agg?._sum?.viewedCount ?? 0,
            uniqueViewers: unique ?? 0,
            myViews,
        };
    }

    async getArchitectSummary(architectId, userId = null) {
        const [agg, unique] = await Promise.all([
            prisma.viewedArsitek.aggregate({
                where: { architectId },
                _sum: { viewedCount: true },
            }),
            prisma.viewedArsitek.count({ where: { architectId } }),
        ]);

        let myViews = null;
        if (userId) {
            const mine = await prisma.viewedArsitek.findUnique({
                where: { userId_architectId: { userId, architectId } },
                select: { viewedCount: true },
            });
            myViews = mine?.viewedCount ?? 0;
        }

        return {
            totalViews: agg?._sum?.viewedCount ?? 0,
            uniqueViewers: unique ?? 0,
            myViews,
        };
    }
}

module.exports = new ViewRepository();
