export interface GCodeCommand {
    type: 'G0' | 'G1' | 'M3' | 'M5';
    x?: number;
    y?: number;
    z?: number;
    f?: number; // Feedrate
    s?: number; // Spindle Speed
}

export function parseGCode(gcode: string): GCodeCommand[] {
    const lines = gcode.split('\n');
    const commands: GCodeCommand[] = [];

    // Simple state tracking for modal commands
    let lastMode = 'G0';

    for (const line of lines) {
        const parts = line.trim().toUpperCase().split(';')[0].split(/\s+/); // Remove comments
        if (parts.length === 0 || parts[0] === '') continue;

        const cmd: any = {};
        let hasMove = false;

        // Check for G/M codes
        if (parts[0].startsWith('G') || parts[0].startsWith('M')) {
            cmd.type = parts[0];
            lastMode = parts[0];
        } else {
            // Implicit mode
            cmd.type = lastMode;
        }

        // Parse Params
        for (const part of parts) {
            const letter = part.charAt(0);
            const value = parseFloat(part.substring(1));

            if (!isNaN(value)) {
                if (letter === 'X') { cmd.x = value; hasMove = true; }
                if (letter === 'Y') { cmd.y = value; hasMove = true; }
                if (letter === 'Z') { cmd.z = value; hasMove = true; }
                if (letter === 'F') cmd.f = value;
                if (letter === 'S') cmd.s = value;
            }
        }

        if (cmd.type === 'G0' || cmd.type === 'G1') {
            if (hasMove) commands.push(cmd as GCodeCommand);
        } else if (cmd.type === 'M3' || cmd.type === 'M5') {
            commands.push(cmd as GCodeCommand);
        }
    }

    return commands;
}
