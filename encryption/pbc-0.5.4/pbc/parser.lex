%{
#include <stdarg.h>
#include <stdio.h>
#include <gmp.h>
#include "pbc_utils.h"
#include "pbc_field.h"

#include "pbc_tree.h"
#define YYSTYPE tree_ptr
#include "parser.tab.h"

extern int option_easy;

%}

%x COMMENT
%%
\/\*                    BEGIN(COMMENT);  // Open C-style comment.
<COMMENT>\*\/           BEGIN(0);        // Close C-style comment.
<COMMENT>.              // Within a C-style comment.
<COMMENT>\n             // Within a C-style comment.
#.*$                    // Comment.
[ \t\r]*                // Whitespace.

[0-9]+                  yylval = tree_new_z(yytext);  return NUM;
[a-zA-Z_][a-zA-Z0-9_]*  yylval = tree_new_id(yytext); return ID;
:=                      return ASSIGN;
==                      return EQ;
!=                      return NE;
\<                      return LT;
\>                      return T_GT;
\<=                     return LE;
\>=                     return GE;
\+                      return PLUS;
-                       return MINUS;
\/                      return DIVIDE;
\*                      return TIMES;
\^                      return POW;
;                       return TERMINATOR;
\,                      return COMMA;
\?                      return QUESTION;
:                       return COLON;
\(                      return LPAR;
\)                      return RPAR;
\[                      return LSQU;
\]                      return RSQU;
\n                      if (option_easy) return TERMINATOR;
=                       return option_easy ? ASSIGN : UNKNOWN;
.                       return UNKNOWN;
%%
