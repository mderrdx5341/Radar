export class SidebarRenderer {
    private ctx: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    public draw(scrWidth: number, scrHeight: number, state: any): void {
        this.ctx.save();

        const sidebarWidth = 200;
        const sidebarX = 0; // ИСПРАВЛЕНО: Сайдбар теперь намертво прижат к ЛЕВОМУ краю!
        const sidebarHeight = scrHeight - 60;

        // 1. Отрисовка подложки сайдбара
        this.ctx.fillStyle = 'rgba(22, 27, 34, 0.88)';
        this.ctx.fillRect(sidebarX, 0, sidebarWidth, sidebarHeight);

        // Правая разграничительная неоновая рамка сайдбара
        this.ctx.strokeStyle = '#30363d';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(sidebarWidth, 0);
        this.ctx.lineTo(sidebarWidth, sidebarHeight);
        this.ctx.stroke();

        // Заголовок панели
        this.ctx.fillStyle = '#8b949e';
        this.ctx.font = 'bold 10px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(' СТАТИСТИКА И ТЕЛЕМЕТРИЯ БАЗЫ', sidebarX + 5, 15);

        this.ctx.strokeStyle = '#21262d';
        this.ctx.beginPath();
        this.ctx.moveTo(sidebarX + 5, 30);
        this.ctx.lineTo(sidebarWidth - 5, 30);
        this.ctx.stroke();

        // 2. Безопасный сбор данных
        const player = state?.player;
        if (!player) {
            this.ctx.restore();
            return;
        }

        const totalRadars = player.radars?.length || 0;
        const totalTurrets = player.turrets?.length || 0;
        const playerBuildings = player.buildings || [];

        const powerNodes = playerBuildings.filter((b: any) => b && b.type === 'POWER');
        const repairBays = playerBuildings.filter((b: any) => b && b.type === 'REPAIR');
        const ammoDepots = playerBuildings.filter((b: any) => b && b.type === 'AMMO_DEPOT');

        const unpoweredRadars = player.radars?.filter((r: any) => r && !r.isPowered).length || 0;
        const networkPenalty = player.radars?.some((r: any) => r && r.isPowered && (r.detectionRadius || 0) < 180) || false;
        const starvedTurrets = player.turrets?.filter((t: any) => t && !t.isSupplied && (t.currentAmmo || 0) <= 0).length || 0;
        const ammoPenalty = player.turrets?.some((t: any) => t && t.hasPenalty) || false;

        let sRadars = 0; let mRadars = 0;
        powerNodes.forEach((p: any) => { 
            sRadars += p.connectedRadarsCount || p.connectedRadarCount || 0; 
            mRadars += p.maxSafeLoad || 3; 
        });

        let sTurrets = 0; let mTurrets = 0;
        ammoDepots.forEach((a: any) => { 
            sTurrets += a.connectedTurretsCount || a.connectedTurretCount || 0; 
            mTurrets += a.maxSafeLoad || 3; 
        });

        let sRepair = 0; let mRepair = 0;
        repairBays.forEach((r: any) => { 
            sRepair += r.connectedBuildingsCount || r.connectedBuildingCount || 0; 
            mRepair += r.maxSafeLoad || 3; 
        });

        let startY = 45;
        const textX = sidebarX + 10;

        // Вывод РЛС
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '11px monospace';
        this.ctx.fillText(`📡 РЛС: ${totalRadars} шт.`, textX, startY);
        if (unpoweredRadars > 0) {
            this.ctx.fillStyle = '#ff4444';
            this.ctx.font = 'bold 9px monospace';
            this.ctx.fillText(` [🚨 ${unpoweredRadars} ОБЕСТОЧЕН]`, textX + 95, startY + 1);
        } else if (networkPenalty) {
            this.ctx.fillStyle = '#f59e0b';
            this.ctx.font = 'bold 9px monospace';
            this.ctx.fillText(' [⚠️ СЛАБЫЙ ТОК]', textX + 95, startY + 1);
        }
        startY += 32;

        // Вывод ПВО
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '11px monospace';
        this.ctx.fillText(`🎯 ПВО: ${totalTurrets} шт.`, textX, startY);
        if (starvedTurrets > 0) {
            this.ctx.fillStyle = '#ff4444';
            this.ctx.font = 'bold 9px monospace';
            this.ctx.fillText(` [🚨 ${starvedTurrets} БЕЗ БК]`, textX + 95, startY + 1);
        } else if (ammoPenalty) {
            this.ctx.fillStyle = '#fbbf24';
            this.ctx.font = 'bold 9px monospace';
            this.ctx.fillText(' [⚠️ ДЕФИЦИТ БК]', textX + 95, startY + 1);
        }
        startY += 32;

        // Вывод Энергии
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '11px monospace';
        this.ctx.fillText(`⚡ Энергия: ${powerNodes.length} шт.`, textX, startY);
        if (powerNodes.length > 0) {
            this.ctx.fillStyle = sRadars > mRadars ? '#ff4444' : '#38bdf8';
            this.ctx.font = 'bold 9px monospace';
            this.ctx.fillText(` [СЕТЬ: ${sRadars}/${mRadars}]`, textX + 110, startY + 1);
        }
        startY += 32;

        // Вывод Логистики
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '11px monospace';
        this.ctx.fillText(`📦 Логистика: ${ammoDepots.length} шт.`, textX, startY);
        if (ammoDepots.length > 0) {
            this.ctx.fillStyle = sTurrets > mTurrets ? '#f59e0b' : '#fbbf24';
            this.ctx.font = 'bold 9px monospace';
            this.ctx.fillText(` [ПОДВОЗ: ${sTurrets}/${mTurrets}]`, textX + 110, startY + 1);
        }
        startY += 32;

        // Вывод Ремонта
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '11px monospace';
        this.ctx.fillText(`🛠️ Рем-Доки: ${repairBays.length} шт.`, textX, startY);
        if (repairBays.length > 0) {
            this.ctx.fillStyle = sRepair > mRepair ? '#ffaa00' : '#34d399';
            this.ctx.font = 'bold 9px monospace';
            this.ctx.fillText(` [РЕМОНТ: ${sRepair}/${mRepair}]`, textX + 110, startY + 1);
        }

        this.ctx.restore();
    }
}
