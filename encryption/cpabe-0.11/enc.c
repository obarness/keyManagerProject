#include <stdint.h>
#include <stdlib.h>
//REMOVE

#include <string.h>
#include <unistd.h>
#include <glib.h>
#include <pbc.h>
#include <pbc_random.h>
#include <math.h>

#include "bswabe.h"
#include "common.h"
#include "policy_lang.h"





char* usage =
"Usage: cpabe-enc -p [PUBLIC KEY] -m [MASTER KEY] -i [INPUT FILE] -a [ID1 ID2 ... IDr] [OPTIONS]\n"
"\n"
"Encrypt the input file by using the revoke clients' attributes listed under the option -a\n"
"with the public key. The encrypted file will be written to FILE.cpabe unless\n"
"the -o option is used.\n"
"\n"
"Mandatory arguments to long options are mandatory for short options too.\n\n"
" -h, --help               	print this message\n\n"
" -v, --version            	print version information\n\n"
" -k, --keep-input-file    	don't delete original file\n\n"
" -p 				the public key's file name\n\n"
" -m 				the master key's file name\n\n"
" -i 				the input file name to encrypt\n\n"
" -o			        write resulting key to FILE\n\n"
" -a				the revoke clients' attributes\n\n"
"";

/*
 * encryption pattern:
 * cpabe-enc -p pub_key -m msk_key -i security_report.pdf -a ’[ID1]...[IDr]’
 */
char* pub_file = 0;
char* msk_file = 0;
char* in_file  = 0;
char* out_file = 0;
char* attr     = 0;
int   keep     = 0;

void
parse_args( int argc, char** argv )
{
	int i;

	for( i = 1; i < argc; i++ )
	{
		if( !strcmp(argv[i], "-h") || !strcmp(argv[i], "--help") )
		{
			printf ("argument is help\n");
			printf("%s", usage);
			exit(0);
		}
		else if( !strcmp(argv[i], "-v") || !strcmp(argv[i], "--version") )
		{
			printf ("argument is version\n");
			printf(CPABE_VERSION, "-enc");
			exit(0);
		}
		else if( !strcmp(argv[i], "-k") || !strcmp(argv[i], "--keep-input-file") )
		{
			printf ("argument is keep\n");
			keep = 1;
		}
		else if( !strcmp(argv[i], "-o") || !strcmp(argv[i], "--output") )
		{
			printf ("argument is output - %s\n", out_file);
			if( ++i >= argc )
			{
				die(usage);
			}
			else
			{
				out_file = argv[i];
				printf("argument out_file: %s\n", out_file);
			}
		}
		else if( !strcmp(argv[i], "-d") || !strcmp(argv[i], "--deterministic") )
		{
			printf ("argument is deterministic\n");
			pbc_random_set_deterministic(0);
		}
		else if( !strcmp(argv[i], "-p"))		//the flag for the public key file name
		{
			if( ++i >= argc )
			{
				die(usage);
			}
			else
			{
				pub_file = argv[i];
				printf("argument pub_file: %s\n", pub_file);
			}
		}
		else if( !strcmp(argv[i], "-m"))		//the flag for the master secret key file name
		{
			if( ++i >= argc )
			{
				die(usage);
			}
			else
			{
				msk_file = argv[i];
				printf ("argument is master key - %s\n", msk_file);
			}
		}
		else if( !strcmp(argv[i], "-i"))		//the flag for the master secret key file name
		{
			if( ++i >= argc )
			{
				die(usage);
			}
			else
			{
				in_file = argv[i];
				printf ("argument is input file - %s\n", in_file);
			}
		}
		else if (!strcmp(argv[i], "-a"))		//the flag for the attribute
		{
			if( ++i >= argc )
			{
				die(usage);
			}
			else
			{
				attr = argv[i];					//get the attributes from the arguments
				printf ("argument is attribute\n");
			}
		}
		else
		{
			printf ("argument is default%s\n" ,argv[i]);
//			die(usage);
		}
	}

	if( !pub_file || !in_file || !attr)
	{
		die(usage);
	}

	if( !out_file )
	{
		out_file = g_strdup_printf("%s.cpabe", in_file);	//add the .cpabe postfix to the output file name
		printf ("the out_file is: %s\n", out_file);
	}
}

/*
 * Read the content of the input file and converting each character to the character form of the
 * ASCII value. 'a' = 97 -> '0''9''7'.
 */
unsigned char* readFromFile (char* file_name)
{
	printf ("cpabe-enc -The file's name is: %s\n", file_name);
	FILE *f;
	GByteArray* byteArray;		//the dynamic array that will hold the file's content
	unsigned char* fileContentString;	//the string after conversion

	int num;					//the char red from the file
	int temp;					//for number conversion
	guint8 c;					//the char after conversion

	int i = 0;
	byteArray = g_byte_array_new();
	f = fopen(file_name, "r");
	if (f == NULL)
	{
		fprintf(stderr, "Can't open input file in.list!\n");
		exit(1);
	}

	printf("\t\t\t");
	num = fgetc(f);
	while (num != EOF)
	{
		printf("%d", num);
		for (i = 2; i>=0; i--)
		{
			temp = num/pow(10,i);        

			//			printf ("the current digit is: %d\t", temp);
			num = (int) (num % (int)pow(10, i));
			c = (guint8) (temp+48); 	//convert from digit to char form of the digit. 1 -> '1'
			//			printf("the char is: %c\n", c);
			g_byte_array_append(byteArray, &c, 1);	//add the digit to the dinamic array
		}
		num = fgetc(f);
	};
	fclose(f);
	c = 0;
	g_byte_array_append(byteArray, &c, 1);
//	printf("\ndinamic array size: %d\n", byteArray->len);
	fileContentString = (unsigned char*)malloc (sizeof(char)*byteArray->len);	//allocate the string in mem

	printf("\nbyteArray:\t\t%s\n", byteArray->data);
	memcpy(fileContentString, byteArray->data, byteArray->len);	//copy the dynamic array's content to the string
	fileContentString[byteArray->len] = '\0';
	printf("the final string is:\t%s, length: %d\n", fileContentString, strlen(fileContentString));

	g_byte_array_free (byteArray, 1);							//deallocate the dynamic array
	return fileContentString;
}

int
main( int argc, char** argv )
{
	bswabe_pub_t* pub;
	bswabe_msk_t* msk;
	bswabe_cph_t* cph;

	unsigned char* fileString;

	printf ("cpabe-enc - Start parsing arguments\n");
	parse_args(argc, argv);

	pub = bswabe_pub_unserialize(suck_file(pub_file), 1);
	msk = bswabe_msk_unserialize(pub, suck_file(msk_file), 1);

	printf ("cpabe-enc - Reading from the input file\n");
	fileString = readFromFile(in_file);
	printf("the STRING:\t\t%s\n", fileString);


	printf ("cpabe-enc - Entering enc on libbswabe\n");
	if( !(cph = bswabe_enc(pub, msk, fileString, attr)) )
	{
		printf("cpabe-enc - Enc ended with an error\n");
		die("%s", bswabe_error());
	}
	else
	{
		spit_file(out_file, bswabe_cph_serialize(cph), 1);
		spit_file(msk_file, bswabe_msk_serialize(msk), 1);
		if( !keep )
		{
			unlink(in_file);
		}
	}
	free(fileString);

	printf ("cpabe-enc - encryption is done\n");

	return 0;
}
