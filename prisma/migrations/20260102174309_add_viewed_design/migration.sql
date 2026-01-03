-- CreateTable
CREATE TABLE "ViewedDesignUser" (
    "userId" TEXT NOT NULL,
    "designId" TEXT NOT NULL,
    "viewedCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ViewedDesignUser_pkey" PRIMARY KEY ("userId","designId")
);

-- CreateTable
CREATE TABLE "ViewedDesignArchitect" (
    "architectId" TEXT NOT NULL,
    "designId" TEXT NOT NULL,
    "viewedCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ViewedDesignArchitect_pkey" PRIMARY KEY ("architectId","designId")
);

-- CreateIndex
CREATE INDEX "ViewedDesignUser_designId_idx" ON "ViewedDesignUser"("designId");

-- CreateIndex
CREATE INDEX "ViewedDesignArchitect_designId_idx" ON "ViewedDesignArchitect"("designId");

-- AddForeignKey
ALTER TABLE "ViewedDesignUser" ADD CONSTRAINT "ViewedDesignUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewedDesignUser" ADD CONSTRAINT "ViewedDesignUser_designId_fkey" FOREIGN KEY ("designId") REFERENCES "designs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewedDesignArchitect" ADD CONSTRAINT "ViewedDesignArchitect_architectId_fkey" FOREIGN KEY ("architectId") REFERENCES "architects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewedDesignArchitect" ADD CONSTRAINT "ViewedDesignArchitect_designId_fkey" FOREIGN KEY ("designId") REFERENCES "designs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
