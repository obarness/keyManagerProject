#include <assert.h>
#include <string.h>
#include <unistd.h>
#include <glib.h>
#include <pbc.h>
#include <pbc_random.h>
#include <math.h>

#include "bswabe.h"
#include "common.h"


char* usage =
"Usage: cpabe-dec [OPTION ...] PUB_KEY PRIV_KEY FILE\n"
"\n"
"Decrypt FILE using private key PRIV_KEY and assuming public key\n"
"PUB_KEY. If the name of FILE is X.cpabe, the decrypted file will\n"
"be written as X and FILE will be removed. Otherwise the file will be\n"
"decrypted in place. Use of the -o option overrides this\n"
"behavior.\n"
"\n"
"Mandatory arguments to long options are mandatory for short options too.\n\n"
" -h, --help               	print this message\n\n"
" -v, --version            	print version information\n\n"
" -k, --keep-input-file    	don't delete original file\n\n"
" -p 				the public key's file name\n\n"
" -c 				the client's private key file name\n\n"
" -i 				the input file name to decrypt\n\n"
" -o			        write output to FILE\n\n"
" -a				the client's id\n\n"
" -d, --deterministic      	use deterministic \"random\" numbers\n"
"                          	(only for debugging)\n\n"
"";

/*
 * decryption pattern:
 * cpabe-dec -p pub_key -c prv_key -i file.xxx.cpabe -a ’[ID]’
 */
char* pub_file	= 0;	//public key
char* prv_file	= 0;	//private client's key SK
char* in_file	= 0;	//the file to decrypted
char* out_file	= 0;	//the output file name
long  id_value	= 0;	//the client's id. this MUST match the id in the private key

int   keep       = 0;	//to delete the encrypted file or not


void
parse_args( int argc, char** argv )
{
	int i;

	for( i = 1; i < argc; i++ )
	{
		if(      !strcmp(argv[i], "-h") || !strcmp(argv[i], "--help") )
		{
			printf ("cpabe-dec - argument help\n");
			printf("%s", usage);
			exit(0);
		}
		else if( !strcmp(argv[i], "-v") || !strcmp(argv[i], "--version") )
		{
			printf ("cpabe-dec - argumrnt version\n");
			printf(CPABE_VERSION, "-dec");
			exit(0);
		}
		else if( !strcmp(argv[i], "-k") || !strcmp(argv[i], "--keep-input-file") )
		{
			printf ("cpabe-dec - argument keep\n");
			keep = 1;
		}
		else if( !strcmp(argv[i], "-o"))
		{
			printf ("cpabe-dec - argument out_file\n");
			if( ++i >= argc )
			{
				die(usage);
			}
			else
			{
				out_file = argv[i];
			}
		}
		else if( !strcmp(argv[i], "-d") || !strcmp(argv[i], "--deterministic") )
		{
			printf ("cpabe-dec - argument deterministic\n");
			pbc_random_set_deterministic(0);
		}
		else if( !strcmp(argv[i], "-p"))
		{
			printf ("cpabe-dec - argument pub_file\n");
			if( ++i >= argc )
			{
				die(usage);
			}
			else
			{
				pub_file = argv[i];
			}
		}
		else if( !strcmp(argv[i], "-c"))
		{
			printf ("cpabe-dec - argument prv_file\n");
			if( ++i >= argc )
			{
				die(usage);
			}
			else
			{
				prv_file = argv[i];
			}
		}
		else if( !strcmp(argv[i], "-i"))
		{
			printf ("cpabe-dec - argument in_file\n");
			if( ++i >= argc )
			{
				die(usage);
			}
			else
			{
				in_file = argv[i];
				printf("the in_file is: %s\n", in_file);
			}
		}
		else if( !strcmp(argv[i], "-a"))
		{
			printf ("cpabe-dec - argument id_value\n");
			if( ++i >= argc )
			{
				die(usage);
			}
			else
			{
				id_value = atoi(argv[i]);		//convert the id from string to long;
			}
		}
		else
		{
			printf ("cpabe-dec - argument default\n");
			die(usage);
		}
	}

	if( !pub_file || !prv_file || !in_file || !id_value)
	{
		printf ("cpabe-dec - no assined argument\n");
		die(usage);
	}

	if( !out_file )
	{
		if(  strlen(in_file) > 6 && !strcmp(in_file + strlen(in_file) - 6, ".cpabe") )
		{
			out_file = g_strndup(in_file, strlen(in_file) - 6);
		}
		else
		{
			out_file = strdup(in_file);
		}
	}
	
	if( keep && !strcmp(in_file, out_file) )
	{
		die("cannot keep input file when decrypting file in place (try -o)\n");
	}
}

/*
 * write the decrypted message to a new fle by the name file_name.
 */
void writeToFile(char* file_name, char* message)
{
	FILE* f;
	int j =0;

	f = fopen(out_file, "w");
	if (f == NULL)
	{
		fprintf(stderr, "Can't open input file in.list!\n");
		exit(1);
	}

	printf("size %d\n", (int)strlen(message));
	int newNum=0;
	int expo = 2;

	for (j=0; j< (int)strlen(message); j++)
	{
		//		printf("the current char: %c\n", elementString[j]);
		newNum = newNum + ((int)message[j] - 48) *pow(10,expo) ;
		if (expo == 0)
		{
			printf("%d", newNum);
			fputc(newNum, f);
			expo = 3;
			newNum = 0;
		}
		expo--;
	}

	fclose(f);
	printf("\nfinally:\t\t%s\n", message);
	free(message);
}

int
main( int argc, char** argv )
{

	bswabe_pub_t* pub;
	bswabe_prv_t* prv;
	bswabe_cph_t* cph;

	char* msg = 0;

	printf ("cpabe-dec - Parsing arguments\n");
	parse_args(argc, argv);

	pub = bswabe_pub_unserialize(suck_file(pub_file), 1);
	prv = bswabe_prv_unserialize(pub, suck_file(prv_file), 1);
	
	GByteArray* sucked_file = suck_file(in_file);
	//if return 0 is here, program doesn't fail




	//this function is causing the problem in webkit but not in terminal, why?!?!?
	cph = bswabe_cph_unserialize(pub, sucked_file, 1);
		

	printf("cpabe-dec - going to dec in libbswabe\n");
	
	msg = bswabe_dec(pub, prv, cph, id_value);
	if( !msg)
	{
		perror("Decryption failed");
//		die("%s", bswabe_error());
	}
	else
	{
		printf("the decrypted message is:\t%s\n", msg);
		writeToFile(out_file, msg);
		
		spit_file(prv_file, bswabe_prv_serialize(prv), 1);
	}
//	bswabe_cph_free(cph);		//TODO

	if( !keep )
	{
		unlink(in_file);
	}

	return 0;
}