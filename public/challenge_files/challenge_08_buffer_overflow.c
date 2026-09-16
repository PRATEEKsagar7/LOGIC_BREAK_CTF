#include <stdio.h>
#include <string.h>
#include <stdlib.h>

void win() {
    printf(\"EXPLOIT SUCCESSFUL!\n\");
    printf(\"FLAG: logicCTF{b1n4ry_0v3rfl0w_r3t2l1bc_pwnd}\n\");
}

void vuln() {
    char buffer[64];
    printf(\"Enter operational payload: \");
    gets(buffer); // Vulnerable to stack smash
}

int main() {
    vuln();
    return 0;
}
