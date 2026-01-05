const prisma = require("../../../config/prisma-client");
const architectRepository = require("../repositories/architect.repository");
const { BadRequestError, NotFoundError } = require("../../../errors/app-errors");

class AdminTransactionService {
    async list({ page = 1, limit = 20, status, search, architectId }) {
        const p = Number(page) || 1;
        const l = Number(limit) || 20;

        const where = {};
        if (status) where.status = String(status).toUpperCase();
        if (architectId) where.architectId = architectId;

        if (search) {
            where.OR = [
                { orderId: { contains: search, mode: "insensitive" } },
                { paymentToken: { contains: search, mode: "insensitive" } },
            ];
        }

        const [total, rows] = await Promise.all([
            prisma.transaction.count({ where }),
            prisma.transaction.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (p - 1) * l,
                take: l,
                include: {
                    architect: { select: { id: true, name: true, email: true, status: true } },
                },
            }),
        ]);

        return {
            data: rows,
            pagination: { page: p, limit: l, total, totalPages: Math.max(1, Math.ceil(total / l)) },
        };
    }

    async detail(id) {
        const tx = await prisma.transaction.findUnique({
            where: { id },
            include: { architect: true },
        });
        if (!tx) throw new NotFoundError("Transaction not found");
        return tx;
    }

    async updateStatus(id, status) {
        if (!status) throw new BadRequestError("status is required");
        const s = String(status).toUpperCase();

        const tx = await prisma.transaction.findUnique({ where: { id } });
        if (!tx) throw new NotFoundError("Transaction not found");

        const updated = await prisma.transaction.update({
            where: { id },
            data: { status: s, paidAt: s === "SUCCESS" ? new Date() : tx.paidAt },
        });

        // RULE OPERASIONAL: transaksi SUCCESS => architect ACTIVE
        if (s === "SUCCESS") {
            await architectRepository.updateStatus(tx.architectId, "ACTIVE");
        }

        return updated;
    }
}

module.exports = new AdminTransactionService();
