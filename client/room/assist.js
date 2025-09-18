// библиотека расчёта очков ассистов для TDM

import { GameMode } from 'pixel_combats/room';

const MAP_LENGTH_PARAM = 'default_game_mode_length';
const MAP_MODIFIERS = {
	Length_S: 0.8,
	Length_M: 1.0,
	Length_L: 1.2,
	Length_XL: 1.4,
};

function getMapModifier() {
	const length = GameMode.Parameters.GetString(MAP_LENGTH_PARAM);
	return MAP_MODIFIERS[length] || 1.0;
}

// базовая команда очков за килл (для командного счётчика в режиме)
const KILL_SCORES = 5;

// базовые очки (для средних карт)
const CATEGORY_SCORES = {
	melee:   { head: 192, body: 120 },
	pistol:  { head: 120, body: 96 },
	grenade: { head: 168, body: 108 },
	smg:     { head: 132, body: 84 },
	shotgun: { head: 144, body: 90 },
	rifle:   { head: 150, body: 96 },
	sniper:  { head: 240, body: 144 },
	lmg:     { head: 150, body: 96 },
};

// маппинг ID оружия -> категория
const WEAPON_CATEGORY = {
	1: 'pistol',     // Beretta
	2: 'rifle',      // AK-47
	3: 'pistol',     // Desert Eagle
	4: 'lmg',        // M249 SAW
	6: 'melee',      // Лопата
	7: 'shotgun',    // Remington 870
	9: 'smg',        // MP5
	10: 'grenade',   // Граната
	11: 'melee',     // M9 Bayonet
	12: 'melee',     // Knife
	13: 'sniper',    // M24
	14: 'rifle',     // M4A1
	18: 'sniper',    // AWP
	20: 'sniper',    // AWP (дубликат)
};

function getWeaponCategory(weaponId) {
	return WEAPON_CATEGORY[weaponId] || 'rifle';
}

// очки убийства по оружию/хедшоту × модификатор карты
function calcKillScore(weaponId, isHeadshot) {
	const category = getWeaponCategory(weaponId);
	const base = (isHeadshot ? CATEGORY_SCORES[category].head : CATEGORY_SCORES[category].body);
	return Math.round(base * getMapModifier());
}

// удобный вариант: расчёт очков убийства из IHitData
function calcKillScoreFromHit(hit) {
	if (!hit) return 0;
	return calcKillScore(hit.WeaponID, hit.IsHeadShot === true);
}

// базовая формула ассиста: 60 × модификатор карты
function calcAssistScore(assistItem) {
	// assistItem содержит поля: Attacker, Damage, Hits, IsKiller (false)
	// при необходимости здесь можно учесть Damage/Hits
	return Math.round(60 * getMapModifier());
}

// применяет начисления очков по отчёту убийства (убийца + ассисты)
export function applyKillReportScores(victim, killer, report, scoresPropName) {
	if (!report) return;
	// убийца
	if (killer && victim && killer.Team != null && victim.Team != null && killer.Team != victim.Team) {
		++killer.Properties.Kills.Value;
		if (killer.Team != null)
			killer.Team.Properties.Get(scoresPropName).Value += KILL_SCORES;
		killer.Properties.Scores.Value += calcKillScoreFromHit(report.KillHit);
	}
	// ассисты
	const items = report.Items || [];
	for (const it of items) {
		if (!it || it.IsKiller) continue;
		const p = it.Attacker;
		if (!p || !victim || p.Team == null || victim.Team == null) continue;
		if (p.Team === victim.Team) continue;
		p.Properties.Scores.Value += calcAssistScore(it);
	}
}


