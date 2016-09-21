/* A Bison parser, made by GNU Bison 2.3.  */

/* Skeleton interface for Bison's Yacc-like parsers in C

   Copyright (C) 1984, 1989, 1990, 2000, 2001, 2002, 2003, 2004, 2005, 2006
   Free Software Foundation, Inc.

   This program is free software; you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation; either version 2, or (at your option)
   any later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with this program; if not, write to the Free Software
   Foundation, Inc., 51 Franklin Street, Fifth Floor,
   Boston, MA 02110-1301, USA.  */

/* As a special exception, you may create a larger work that contains
   part or all of the Bison parser skeleton and distribute that work
   under terms of your choice, so long as that work isn't itself a
   parser generator using the skeleton or a modified version thereof
   as a parser skeleton.  Alternatively, if you modify or redistribute
   the parser skeleton itself, you may (at your option) remove this
   special exception, which will cause the skeleton and the resulting
   Bison output files to be licensed under the GNU General Public
   License without this special exception.

   This special exception was added by the Free Software Foundation in
   version 2.2 of Bison.  */

/* Tokens.  */
#ifndef YYTOKENTYPE
# define YYTOKENTYPE
   /* Put the tokens into the symbol table, so that GDB and other debuggers
      know about them.  */
   enum yytokentype {
     END = 0,
     TERMINATOR = 258,
     NUM = 259,
     ID = 260,
     LPAR = 261,
     RPAR = 262,
     LSQU = 263,
     RSQU = 264,
     COMMA = 265,
     COLON = 266,
     QUESTION = 267,
     GE = 268,
     LE = 269,
     T_GT = 270,
     LT = 271,
     NE = 272,
     EQ = 273,
     ASSIGN = 274,
     MINUS = 275,
     PLUS = 276,
     TIMES = 277,
     DIVIDE = 278,
     UMINUS = 279,
     POW = 280,
     UNKNOWN = 281
   };
#endif
/* Tokens.  */
#define END 0
#define TERMINATOR 258
#define NUM 259
#define ID 260
#define LPAR 261
#define RPAR 262
#define LSQU 263
#define RSQU 264
#define COMMA 265
#define COLON 266
#define QUESTION 267
#define GE 268
#define LE 269
#define T_GT 270
#define LT 271
#define NE 272
#define EQ 273
#define ASSIGN 274
#define MINUS 275
#define PLUS 276
#define TIMES 277
#define DIVIDE 278
#define UMINUS 279
#define POW 280
#define UNKNOWN 281




#if ! defined YYSTYPE && ! defined YYSTYPE_IS_DECLARED
typedef int YYSTYPE;
# define yystype YYSTYPE /* obsolescent; will be withdrawn */
# define YYSTYPE_IS_DECLARED 1
# define YYSTYPE_IS_TRIVIAL 1
#endif

extern YYSTYPE yylval;

